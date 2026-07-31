import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { LessonActions } from "./lesson-actions";

type LessonsPageProps = { params: Promise<{ courseId: string }> };

export default async function LessonsPage({ params }: LessonsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN) redirect("/dashboard");

  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || (session.user.role !== Role.ADMIN && course.teacherId !== session.user.id)) redirect("/teacher");

  const lessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
    orderBy: { position: "asc" },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Lessons</h1>
            <p className="mt-1 text-muted-foreground">Manage lessons for {course.title}.</p>
          </div>
          <Button asChild><Link href={`/teacher/courses/${course.id}/lessons/create`}>Create Lesson</Link></Button>
        </header>
        {lessons.length === 0 ? (
          <Card className="items-center py-12 text-center"><CardHeader><CardTitle>No lessons yet</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Create the first lesson for this course.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div><CardTitle>{lesson.position}. {lesson.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{lesson.isPublished ? "Published" : "Draft"}</p></div>
                  <LessonActions courseId={course.id} lessonId={lesson.id} />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
