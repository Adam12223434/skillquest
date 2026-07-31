import Image from "next/image";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCourseProgress } from "@/lib/lesson-progress";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export default async function MyCoursesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== Role.STUDENT) {
    redirect("/dashboard");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          teacher: {
            select: { name: true },
          },
          lessons: { orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const coursesWithProgress = await Promise.all(
    enrollments.map(async ({ course, enrolledAt }) => {
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lesson: { courseId: course.id },
        },
      });

      const stats = getCourseProgress(course.lessons, progress);

      return { course, enrolledAt, stats };
    })
  );

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Continue learning from the courses you have enrolled in.
          </p>
        </header>

        {enrollments.length === 0 ? (
          <Card className="items-center py-12 text-center">
            <CardHeader>
              <CardTitle>No enrolled courses yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven&apos;t enrolled in any courses yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section
            aria-label="Enrolled courses"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {coursesWithProgress.map(({ course, enrolledAt, stats }) => (
              <Card key={course.id} className="h-full">
                {course.imageUrl ? (
                  <Image
                    alt={`${course.title} course image`}
                    className="h-44 w-full object-cover"
                    height={352}
                    src={course.imageUrl}
                    unoptimized
                    width={640}
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-primary/10 text-sm font-medium text-primary">
                    SkillQuest Course
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>{course.title}</CardTitle>
                    <span className="text-sm font-medium text-primary">
                      {stats.percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By {course.teacher.name ?? "SkillQuest Teacher"}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="line-clamp-3 text-muted-foreground">
                    {course.description}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed} / {stats.total} lessons completed
                  </p>
                </CardContent>
                <CardFooter className="flex-col items-start gap-3">
                  <p className="text-xs text-muted-foreground">
                    Enrolled {dateFormatter.format(enrolledAt)}
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/courses/${course.id}`}>Continue Learning</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
