import { prisma } from "@/app/lib/prisma";
import TranscriptUploadForm from "./TranscriptUploadForm";
import TranscriptListItem from "./TranscriptListItem";

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
              <TranscriptListItem
                key={transcript.id}
                transcript={{
                  ...transcript,
                  createdAt: transcript.createdAt.toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
