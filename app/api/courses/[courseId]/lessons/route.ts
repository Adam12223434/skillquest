import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required."),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  videoUrl: z.string().url("Video URL must be valid.").nullable().optional(),
  position: z.number().int().min(1, "Position must be at least 1."),
});

type RouteContext = { params: Promise<{ courseId: string }> };

async function getManagedCourse(courseId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthenticated." }, { status: 401 }) };
  }

  if (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    return { error: NextResponse.json({ error: "Course not found." }, { status: 404 }) };
  }

  if (session.user.role !== Role.ADMIN && course.teacherId !== session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { course };
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { courseId } = await params;
    const access = await getManagedCourse(courseId);

    if (access.error) return access.error;

    const result = createLessonSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: { ...result.data, courseId: access.course.id },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    console.error("Failed to create lesson:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
