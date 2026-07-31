import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ courseId: string }>;
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

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, published: true },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled." }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Already enrolled." }, { status: 400 });
    }

    console.error("Failed to enroll in course:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
