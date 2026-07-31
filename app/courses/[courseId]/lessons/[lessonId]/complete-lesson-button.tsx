"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CompleteLessonButtonProps = {
  lessonId: string;
  initialCompleted: boolean;
};

export function CompleteLessonButton({
  lessonId,
  initialCompleted,
}: CompleteLessonButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);

  async function markComplete() {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/lessons/${lessonId}/complete`,
        {
          method: "POST",
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to mark lesson complete.");
      }

      setCompleted(true);
      toast.success("Lesson marked as complete.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to mark lesson complete."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (completed) {
    return (
      <Button disabled variant="secondary">
        ✓ Completed
      </Button>
    );
  }

  return (
    <Button disabled={isSubmitting} onClick={markComplete}>
      {isSubmitting ? "Saving..." : "Mark as Complete"}
    </Button>
  );
}
