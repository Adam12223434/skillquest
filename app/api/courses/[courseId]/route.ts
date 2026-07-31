import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateCourseSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters.").optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters.")
      .optional(),
    imageUrl: z.string().url("Image URL must be valid.").nullable().optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No updates provided.");

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

async function authorizeCourseAccess(courseId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthenticated." }, { status: 401 }) };
  }

  if (
    session.user.role !== Role.TEACHER &&
    session.user.role !== Role.ADMIN
  ) {
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

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { courseId } = await params;
    const access = await authorizeCourseAccess(courseId);

    if (access.error) {
      return access.error;
    }

    const result = updateCourseSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const course = await prisma.course.update({
      where: { id: access.course.id },
      data: result.data,
    });

    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    console.error("Failed to update course:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { courseId } = await params;
    const access = await authorizeCourseAccess(courseId);

    if (access.error) {
      return access.error;
    }

    await prisma.course.delete({ where: { id: access.course.id } });

    return NextResponse.json({ message: "Course deleted." });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
