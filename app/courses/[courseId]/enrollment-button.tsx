"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function EnrollmentButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);

  async function enroll() {
    setIsEnrolling(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to enroll in this course.");
      }

      toast.success("You are enrolled in this course.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to enroll in this course."
      );
    } finally {
      setIsEnrolling(false);
    }
  }

  return (
    <Button disabled={isEnrolling} onClick={enroll}>
      {isEnrolling ? "Enrolling..." : "Enroll Now"}
    </Button>
  );
}
