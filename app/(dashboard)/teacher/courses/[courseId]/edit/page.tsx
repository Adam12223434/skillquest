import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateCourseForm } from "../../../create-course/create-course-form";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (
    session.user.role !== Role.TEACHER &&
    session.user.role !== Role.ADMIN
  ) {
    redirect("/dashboard");
  }

  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    notFound();
  }

  if (session.user.role !== Role.ADMIN && course.teacherId !== session.user.id) {
    redirect("/teacher");
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
          <p className="mt-1 text-muted-foreground">
            Update your course details and publishing status.
          </p>
        </div>

        <CreateCourseForm
          courseId={course.id}
          defaultValues={{
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl ?? "",
            published: course.published,
          }}
        />
      </div>
    </main>
  );
}
