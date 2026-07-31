import Image from "next/image";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

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
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

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
            {enrollments.map(({ course, enrolledAt }) => (
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
                  <CardTitle>{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    By {course.teacher.name ?? "SkillQuest Teacher"}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="line-clamp-3 text-muted-foreground">
                    {course.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Enrolled {dateFormatter.format(enrolledAt)}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
