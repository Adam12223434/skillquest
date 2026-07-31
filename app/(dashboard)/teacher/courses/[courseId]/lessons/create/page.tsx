import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LessonForm } from "../lesson-form";

type CreateLessonPageProps = { params: Promise<{ courseId: string }> };

export default async function CreateLessonPage({ params }: CreateLessonPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN) redirect("/dashboard");
  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || (session.user.role !== Role.ADMIN && course.teacherId !== session.user.id)) redirect("/teacher");
  const lastLesson = await prisma.lesson.findFirst({ where: { courseId }, orderBy: { position: "desc" } });

  return <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Create Lesson</h1><p className="mt-1 text-muted-foreground">Add a lesson to {course.title}.</p></div><LessonForm courseId={courseId} defaultValues={{ title: "", description: "", content: "", videoUrl: "", position: (lastLesson?.position ?? 0) + 1, isPublished: false }} /></div></main>;
}
