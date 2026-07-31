import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

type CourseCatalogPageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function getPage(value: string | string[] | undefined) {
  const parsedPage = Number(getSearchParam(value));
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function pageHref(page: number, query: string) {
  const params = new URLSearchParams({ page: String(page) });

  if (query) {
    params.set("q", query);
  }

  return `/courses?${params.toString()}`;
}

export default async function CourseCatalogPage({
  searchParams,
}: CourseCatalogPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params.q);
  const requestedPage = getPage(params.page);

  const where: Prisma.CourseWhereInput = {
    published: true,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const totalCourses = await prisma.course.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-muted-foreground">
            Explore published courses created by SkillQuest teachers.
          </p>
        </header>

        <form action="/courses" className="flex max-w-xl gap-2">
          <Input
            aria-label="Search courses"
            defaultValue={query}
            name="q"
            placeholder="Search by title or description"
            type="search"
          />
          <Button type="submit">Search</Button>
        </form>

        {courses.length === 0 ? (
          <Card className="items-center py-12 text-center">
            <CardHeader>
              <CardTitle>No published courses yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {query
                  ? "No published courses match your search. Try another term."
                  : "Check back soon for new learning adventures."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section
              aria-label="Published courses"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((course) => (
                <Card key={course.id} className="h-full">
                  {course.imageUrl ? (
                    <Image
                      alt={`${course.title} course image`}
                      className="h-44 w-full object-cover"
                      src={course.imageUrl}
                      width={640}
                      height={352}
                      unoptimized
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
                  <CardFooter className="flex-col items-start gap-4">
                    <p className="text-xs text-muted-foreground">
                      Published {dateFormatter.format(course.createdAt)}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.id}`}>View Course</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </section>

            {totalPages > 1 && (
              <nav aria-label="Course catalog pagination" className="flex justify-center gap-2">
                {page === 1 ? (
                  <Button disabled variant="outline">
                    Previous
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href={pageHref(page - 1, query)}>Previous</Link>
                  </Button>
                )}
                <p className="flex items-center px-3 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                {page === totalPages ? (
                  <Button disabled variant="outline">
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href={pageHref(page + 1, query)}>Next</Link>
                  </Button>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
