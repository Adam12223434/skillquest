import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CompleteLessonButton } from "./complete-lesson-button";

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function StudentLessonPage({
  params,
}: LessonPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== Role.STUDENT) {
    redirect("/dashboard");
  }

  const { courseId, lessonId } = await params;
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    include: { course: true },
  });

  if (!lesson) {
    notFound();
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
    redirect(`/courses/${courseId}`);
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId: lesson.id,
      },
    },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {lesson.course.title}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {lesson.position}. {lesson.title}
          </h1>
        </div>

        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}

        {lesson.videoUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
              src={lesson.videoUrl}
              title={lesson.title}
            />
          </div>
        )}

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
            {lesson.content}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CompleteLessonButton
            lessonId={lesson.id}
            initialCompleted={progress?.completed ?? false}
          />
        </div>
      </div>
    </main>
  );
}
