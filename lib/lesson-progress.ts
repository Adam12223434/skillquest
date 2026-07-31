import { Lesson, LessonProgress } from "@prisma/client";

export type CourseProgress = {
  completed: number;
  total: number;
  percentage: number;
};

export function getCourseProgress(
  lessons: Lesson[],
  progress: LessonProgress[]
): CourseProgress {
  const total = lessons.length;
  const completed = progress.filter((item) => item.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

export function countCompletedLessons(progress: LessonProgress[]): number {
  return progress.filter((item) => item.completed).length;
}

export function calculateProgressPercentage(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
