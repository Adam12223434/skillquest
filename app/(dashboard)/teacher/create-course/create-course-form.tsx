"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  imageUrl: z.string().url("Image URL must be valid.").optional().or(z.literal("")),
  published: z.boolean(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

type CourseFormProps = {
  courseId?: string;
  defaultValues?: CourseFormValues;
};

export function CreateCourseForm({ courseId, defaultValues }: CourseFormProps) {
  const router = useRouter();
  const isEditing = Boolean(courseId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      published: false,
      ...defaultValues,
    },
  });

  async function onSubmit(values: CourseFormValues) {
    try {
      const response = await fetch(courseId ? `/api/courses/${courseId}` : "/api/courses", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? values : { title: values.title, description: values.description }),
          imageUrl: values.imageUrl || (isEditing ? null : undefined),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            (isEditing ? "Unable to update the course." : "Unable to create the course.")
        );
      }

      toast.success(
        isEditing ? "Course updated successfully." : "Course created successfully."
      );
      router.push("/teacher");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Unable to update the course."
            : "Unable to create the course."
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              disabled={isSubmitting}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={6}
              aria-invalid={Boolean(errors.description)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              aria-invalid={Boolean(errors.imageUrl)}
              disabled={isSubmitting}
              placeholder="https://example.com/course-image.jpg"
              {...register("imageUrl")}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <input
                id="published"
                type="checkbox"
                disabled={isSubmitting}
                className="size-4 rounded border-input"
                {...register("published")}
              />
              <Label htmlFor="published">Publish this course</Label>
            </div>
          )}

          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? isEditing
                ? "Saving Course..."
                : "Creating Course..."
              : isEditing
                ? "Save Changes"
                : "Create Course"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
