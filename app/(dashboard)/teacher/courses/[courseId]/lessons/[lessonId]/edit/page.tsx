import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LessonForm } from "../../lesson-form";

type EditLessonPageProps = { params: Promise<{ courseId: string; lessonId: string }> };

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN) redirect("/dashboard");
  const { courseId, lessonId } = await params;
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, courseId }, include: { course: true } });
  if (!lesson) notFound();
  if (session.user.role !== Role.ADMIN && lesson.course.teacherId !== session.user.id) redirect("/teacher");

  return <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Edit Lesson</h1><p className="mt-1 text-muted-foreground">Update {lesson.title}.</p></div><LessonForm courseId={courseId} lessonId={lesson.id} defaultValues={{ title: lesson.title, description: lesson.description ?? "", content: lesson.content ?? "", videoUrl: lesson.videoUrl ?? "", position: lesson.position, isPublished: lesson.isPublished }} /></div></main>;
}
