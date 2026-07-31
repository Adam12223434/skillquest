import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    if (session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { lessonId } = await params;
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lesson.id,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lessonId: lesson.id,
        completed: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error("Failed to mark lesson complete:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
