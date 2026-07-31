import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./course-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export default async function TeacherDashboardPage() {
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

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Teacher Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage the courses you create for SkillQuest learners.
            </p>
          </div>

          <Button asChild>
            <Link href="/teacher/create-course">Create Course</Link>
          </Button>
        </header>

        <Card className="max-w-xs">
          <CardHeader>
            <p className="text-sm text-muted-foreground">Total courses</p>
            <CardTitle className="text-3xl">{courses.length}</CardTitle>
          </CardHeader>
        </Card>

        {courses.length === 0 ? (
          <Card className="items-center py-12 text-center">
            <CardHeader>
              <CardTitle>No courses yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven&apos;t created any courses yet.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/teacher/create-course">Create Course</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <section
            aria-label="Your courses"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  published: course.published,
                  createdAt: dateFormatter.format(course.createdAt),
                }}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
