import { prisma } from "@/app/lib/prisma";
import BulkUploadForm from "./BulkUploadForm";
import TranscriptsClient from "./TranscriptsClient";
import { PageHeader } from "@/components/page-header";

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
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Transcripts"
          description="Upload recordings and manage transcriptions"
        />

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
