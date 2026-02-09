import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

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
  // Fetch all playbooks
  const playbooks = await prisma.playbook.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
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

          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Generate New Playbook
          </Link>
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
              Generate your first playbook from the Compare page
            </p>
            <Link
              href="/compare"
              className="mt-4 inline-block text-sm text-[#ff6b35] hover:underline"
            >
              Go to Compare →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {playbooks.map((playbook) => {
              const confidenceScores = playbook.confidenceScores as any;

              return (
                <Link
                  key={playbook.id}
                  href={`/playbooks/${playbook.id}`}
                  className="group block rounded-xl border border bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ff6b35]">
                        {playbook.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(playbook.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {playbook.callCount} calls
                        </div>
                        {confidenceScores && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Data Quality: {(confidenceScores.dataQuality * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>

                      {/* Preview */}
                      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                        {playbook.content.split("\n").find((line) => line.trim() && !line.startsWith("#"))}
                      </p>
                    </div>

                    <svg
                      className="ml-4 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#ff6b35]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
