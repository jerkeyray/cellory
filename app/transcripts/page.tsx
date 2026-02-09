import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import TranscriptUploadForm from "./TranscriptUploadForm";

interface Transcript {
  id: string;
  filename: string;
  status: "processing" | "ready" | "error";
  durationSeconds: number | null;
  language: string | null;
  createdAt: Date;
  _count: {
    calls: number;
  };
}

function getStatusBadge(status: string) {
  const styles = {
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status as keyof typeof styles] || ""
      }`}
    >
      {status}
    </span>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TranscriptsPage() {
  // Fetch transcripts server-side
  const transcripts = await prisma.transcript.findMany({
    include: {
      _count: {
        select: { calls: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
              Transcripts
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Upload and manage your audio transcripts
            </p>
          </div>

          <TranscriptUploadForm />
        </div>

        {/* Transcripts List */}
        {transcripts.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-12 text-center dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <svg
              className="mx-auto h-12 w-12 text-[#999]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-[#1a1a1a] dark:text-white">
              No transcripts yet
            </h3>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Upload your first audio file to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {transcripts.map((transcript) => (
              <Link
                key={transcript.id}
                href={`/transcripts/${transcript.id}`}
                className="group rounded-xl border border-[#e5e5e5] bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
                      {transcript.filename}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[#666] dark:text-[#999]">
                      <span>{getStatusBadge(transcript.status)}</span>
                      {transcript.durationSeconds && (
                        <span>
                          Duration: {formatDuration(transcript.durationSeconds)}
                        </span>
                      )}
                      {transcript.language && (
                        <span>Language: {transcript.language.toUpperCase()}</span>
                      )}
                      <span>Calls: {transcript._count.calls}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-[#999]">
                    {formatDate(transcript.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
