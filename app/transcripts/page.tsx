import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import BulkUploadForm from "./BulkUploadForm";
import TranscriptsClient from "./TranscriptsClient";
import { PageHeader } from "@/components/page-header";
import { redirect } from "next/navigation";

export default async function TranscriptsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch transcripts server-side with most recent call ID
  const transcripts = await prisma.transcript.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { calls: true },
      },
      calls: {
        select: { id: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert dates to strings and extract most recent call ID for client component
  const transcriptsData = transcripts.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    mostRecentCallId: t.calls[0]?.id || null,
    calls: undefined, // Don't send full calls array to client
  }));

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Recordings"
          description="Upload and manage your call recordings"
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
