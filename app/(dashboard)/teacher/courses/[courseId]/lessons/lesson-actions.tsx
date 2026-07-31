"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LessonActions({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteLesson() {
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Unable to delete the lesson.");
      toast.success("Lesson deleted successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete the lesson.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/teacher/courses/${courseId}/lessons/${lessonId}/edit`}>Edit</Link></Button>
      <Button disabled={isDeleting} onClick={deleteLesson} size="sm" variant="destructive">{isDeleting ? "Deleting..." : "Delete"}</Button>
    </div>
  );
}
