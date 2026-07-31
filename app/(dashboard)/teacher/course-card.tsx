"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CourseCardProps = {
  course: {
    id: string;
    title: string;
    description: string;
    published: boolean;
    createdAt: string;
  };
};

export function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteCourse() {
    if (!window.confirm(`Delete \"${course.title}\"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete the course.");
      }

      toast.success("Course deleted successfully.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete the course."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{course.title}</CardTitle>
          <span
            className={
              course.published
                ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
            }
          >
            {course.published ? "Published" : "Draft"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground">{course.description}</p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <p className="text-xs text-muted-foreground">
          Created {course.createdAt}
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/teacher/courses/${course.id}/edit`}>Edit</Link>
          </Button>
          <Button
            disabled={isDeleting}
            onClick={deleteCourse}
            size="sm"
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
