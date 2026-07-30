import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreateCourseForm } from "./create-course-form";

export default async function CreateCoursePage() {
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

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Course</h1>
          <p className="mt-1 text-muted-foreground">
            Add a new course for SkillQuest learners.
          </p>
        </div>

        <CreateCourseForm />
      </div>
    </main>
  );
}
