import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GeneratePlaybookButton from "./GeneratePlaybookButton";
import PlaybooksClient from "./PlaybooksClient";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PlaybooksPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch all playbooks
  const playbooks = await prisma.playbook.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const callsWithAggregates = await prisma.call.count({
    where: {
      userId: session.user.id,
      status: "complete",
      aggregates: { some: {} },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Playbooks
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              AI-generated behavioral guidance from your call analyses
            </p>
          </div>

          <GeneratePlaybookButton hasData={callsWithAggregates > 0} />
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border bg-white p-6">
            <div className="text-3xl font-bold text-foreground">
              {playbooks.length}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Total Playbooks
            </div>
          </div>

          <div className="rounded-xl border border bg-white p-6">
            <div className="text-3xl font-bold text-foreground">
              {playbooks.length > 0
                ? Math.max(...playbooks.map((p) => p.callCount))
                : 0}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Max Calls Analyzed
            </div>
          </div>

          <div className="rounded-xl border border bg-white p-6">
            <div className="text-3xl font-bold text-foreground">
              {playbooks.length > 0 ? formatDate(playbooks[0].createdAt).split(",")[0] : "—"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Latest Playbook
            </div>
          </div>
        </div>

        {/* Playbooks List */}
        {playbooks.length === 0 ? (
          <div className="rounded-2xl border border bg-white p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No playbooks yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate your first playbook from your analyzed calls
            </p>
            <div className="mt-4">
              <GeneratePlaybookButton hasData={callsWithAggregates > 0} />
            </div>
          </div>
        ) : (
          <PlaybooksClient
            playbooks={playbooks.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </div>
  );
}
