import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PlaybookContent from "./PlaybookContent";
import PlaybookActions from "./PlaybookActions";

interface PlaybookDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PlaybookDetailPage({ params }: PlaybookDetailPageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  // Fetch playbook
  const playbook = await prisma.playbook.findUnique({
    where: { id },
  });

  if (!playbook) {
    notFound();
  }

  const confidenceScores = playbook.confidenceScores as any;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/playbooks"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-[#ff6b35]"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Playbooks
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {playbook.title}
              </h1>
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
                  Generated {formatDate(playbook.createdAt)}
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
                  Based on {playbook.callCount} calls
                </div>
              </div>
            </div>
            <PlaybookActions playbookId={playbook.id} content={playbook.content} />
          </div>
        </div>

        {/* Confidence Scores */}
        {confidenceScores && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border bg-white p-4">
              <div className="text-xs text-muted-foreground">
                Data Quality
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-[#f5f5f5]">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${confidenceScores.dataQuality * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {(confidenceScores.dataQuality * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {confidenceScores.differentiationStrength !== undefined && (
              <div className="rounded-xl border border bg-white p-4">
                <div className="text-xs text-muted-foreground">
                  Pattern Strength
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-[#f5f5f5]">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${confidenceScores.differentiationStrength * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {(confidenceScores.differentiationStrength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Playbook Content */}
        <div className="rounded-xl border border bg-white p-8">
          <PlaybookContent content={playbook.content} />
        </div>
      </div>
    </div>
  );
}
