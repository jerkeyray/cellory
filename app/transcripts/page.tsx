import { prisma } from "@/app/lib/prisma";
import BulkUploadForm from "./BulkUploadForm";
import TranscriptsClient from "./TranscriptsClient";

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

  // Convert dates to strings for client component
  const transcriptsData = transcripts.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
            Transcripts
          </h1>
          <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
            Upload and manage your call audio files - supports bulk upload of up to 10 files at once
          </p>
        </div>

        {/* Bulk Upload Form */}
        <div className="mb-8">
          <BulkUploadForm />
        </div>

        {/* Transcripts List with Batch Analysis */}
        <TranscriptsClient transcripts={transcriptsData} />
      </div>
    </div>
  );
}
