import Link from "next/link";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-4xl font-bold">
        Welcome back, {user.name} 👋
      </h1>

      {user.role === Role.STUDENT && (
        <nav aria-label="Student dashboard navigation" className="mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard/my-courses">My Courses</Link>
          </Button>
        </nav>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Level</h2>

          <p className="mt-2 text-4xl font-bold">
            {user.level}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">XP</h2>

          <p className="mt-2 text-4xl font-bold">
            {user.xp}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">
            Streak
          </h2>

          <p className="mt-2 text-4xl font-bold">
            🔥 {user.streak}
          </p>
        </div>

      </div>

    </main>
  );
}
