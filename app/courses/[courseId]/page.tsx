import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonProgress, Role } from "@prisma/client";

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
import { EnrollmentButton } from "./enrollment-button";
import { getCourseProgress } from "@/lib/lesson-progress";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

type CourseDetailsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseDetailsPage({
  params,
}: CourseDetailsPageProps) {
  const { courseId } = await params;
  const session = await auth();
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      teacher: {
        select: { id: true, name: true },
      },
      lessons: { orderBy: { position: "asc" } },
    },
  });

  if (!session?.user?.id) {
    notFound();
  }

  const isOwner = session.user.id === course?.teacherId;
  const isAdmin = session.user.role === Role.ADMIN;

  if (!course || (!course.published && !isOwner && !isAdmin)) {
    notFound();
  }

  const enrollment =
    session?.user?.role === Role.STUDENT
      ? await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: course.id,
            },
          },
        })
      : null;

  let progress = null;
  let lessonProgress: LessonProgress[] = [];

  if (enrollment) {
    lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lesson: { courseId: course.id },
      },
    });

    progress = getCourseProgress(course.lessons, lessonProgress);
  }

  const firstIncompleteLesson = enrollment
    ? course.lessons.find((lesson) => {
        const isComplete = lessonProgress.some(
          (p) => p.lessonId === lesson.id && p.completed
        );
        return !isComplete;
      })
    : null;

  const continueHref = firstIncompleteLesson
    ? `/courses/${course.id}/lessons/${firstIncompleteLesson.id}`
    : enrollment && course.lessons.length > 0
      ? `/courses/${course.id}/lessons/${course.lessons[0].id}`
      : undefined;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-6">
        <Card>
          {course.imageUrl ? (
            <Image
              alt={`${course.title} course image`}
              className="h-64 w-full object-cover sm:h-80"
              src={course.imageUrl}
              width={960}
              height={640}
              unoptimized
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-primary/10 text-lg font-medium text-primary sm:h-80">
              SkillQuest Course
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-3xl">{course.title}</CardTitle>
            <p className="text-muted-foreground">
              Created by {course.teacher.name ?? "SkillQuest Teacher"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
              {course.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Created {dateFormatter.format(course.createdAt)}
            </p>

            {enrollment && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">
                    {progress.completed} / {progress.total} lessons completed
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {enrollment && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Lessons</h3>
                <div className="space-y-2">
                  {course.lessons.map((lesson) => {
                    const isComplete = lessonProgress.some(
                      (p) => p.lessonId === lesson.id && p.completed
                    );
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <span className="font-medium">
                          {lesson.position}. {lesson.title}
                        </span>
                        {isComplete ? (
                          <span className="text-sm text-green-600">
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not started
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {!session?.user ? (
              <Button asChild>
                <Link href={`/login?callbackUrl=/courses/${course.id}`}>
                  Login to Enroll
                </Link>
              </Button>
            ) : session.user.role === Role.STUDENT ? (
              enrollment ? (
                <Button asChild>
                  <Link href={continueHref ?? "#"}>Continue Learning</Link>
                </Button>
              ) : (
                <EnrollmentButton courseId={course.id} />
              )
            ) : isAdmin ? (
              <Button asChild>
                <Link href={`/teacher/courses/${course.id}/edit`}>
                  Manage Course
                </Link>
              </Button>
            ) : isOwner ? (
              <Button asChild>
                <Link href={`/teacher/courses/${course.id}/edit`}>Edit Course</Link>
              </Button>
            ) : (
              <Button disabled>Enrollment unavailable</Button>
            )}
          </CardFooter>
        </Card>
      </article>
    </main>
  );
}
