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

const lessonFormSchema = z.object({
  title: z.string().min(1, "Lesson title is required."),
  description: z.string(),
  content: z.string(),
  videoUrl: z.string().url("Video URL must be valid.").or(z.literal("")),
  position: z.number().int().min(1, "Position must be at least 1."),
  isPublished: z.boolean(),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

type LessonFormProps = {
  courseId: string;
  lessonId?: string;
  defaultValues?: LessonFormValues;
};

export function LessonForm({ courseId, lessonId, defaultValues }: LessonFormProps) {
  const router = useRouter();
  const isEditing = Boolean(lessonId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      videoUrl: "",
      position: 1,
      isPublished: false,
      ...defaultValues,
    },
  });

  async function onSubmit(values: LessonFormValues) {
    try {
      const response = await fetch(
        lessonId
          ? `/api/courses/${courseId}/lessons/${lessonId}`
          : `/api/courses/${courseId}/lessons`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            description: values.description || null,
            content: values.content || null,
            videoUrl: values.videoUrl || null,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save the lesson.");
      }

      toast.success(isEditing ? "Lesson updated successfully." : "Lesson created successfully.");
      router.push(`/teacher/courses/${courseId}/lessons`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the lesson."
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input aria-invalid={Boolean(errors.title)} disabled={isSubmitting} id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={isSubmitting} id="description" rows={3} {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={isSubmitting} id="content" rows={10} {...register("content")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input aria-invalid={Boolean(errors.videoUrl)} disabled={isSubmitting} id="videoUrl" type="url" {...register("videoUrl")} />
            {errors.videoUrl && <p className="text-sm text-destructive">{errors.videoUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
  aria-invalid={Boolean(errors.position)}
  disabled={isSubmitting}
  id="position"
  min={1}
  type="number"
  {...register("position", { valueAsNumber: true })}
/>
            {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
          </div>
          {isEditing && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <input className="size-4" disabled={isSubmitting} id="isPublished" type="checkbox" {...register("isPublished")} />
              <Label htmlFor="isPublished">Publish this lesson</Label>
            </div>
          )}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving Lesson..." : isEditing ? "Save Changes" : "Create Lesson"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
