import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateLessonSchema = z
  .object({
    title: z.string().min(1, "Lesson title is required.").optional(),
    description: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    videoUrl: z.string().url("Video URL must be valid.").nullable().optional(),
    position: z.number().int().min(1, "Position must be at least 1.").optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No updates provided.");

type RouteContext = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

async function getManagedLesson(courseId: string, lessonId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthenticated." }, { status: 401 }) };
  }

  if (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    include: { course: true },
  });

  if (!lesson) {
    return { error: NextResponse.json({ error: "Lesson not found." }, { status: 404 }) };
  }

  if (session.user.role !== Role.ADMIN && lesson.course.teacherId !== session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { lesson };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { courseId, lessonId } = await params;
    const access = await getManagedLesson(courseId, lessonId);

    if (access.error) return access.error;

    const result = updateLessonSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id: access.lesson.id },
      data: result.data,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    console.error("Failed to update lesson:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { courseId, lessonId } = await params;
    const access = await getManagedLesson(courseId, lessonId);

    if (access.error) return access.error;

    await prisma.lesson.delete({ where: { id: access.lesson.id } });
    return NextResponse.json({ message: "Lesson deleted." });
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
