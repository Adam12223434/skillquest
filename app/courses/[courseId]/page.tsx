import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

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
    },
  });

  const isOwner = session?.user?.id === course?.teacherId;
  const isAdmin = session?.user?.role === Role.ADMIN;

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

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
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
                <Button>Continue Learning</Button>
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
