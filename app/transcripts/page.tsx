import { prisma } from "@/app/lib/prisma";
import { safeAuth } from "@/app/lib/safe-auth";
import TranscriptsPageContent from "./TranscriptsPageContent";
import { redirect } from "next/navigation";

export default async function TranscriptsPage() {
  const session = await safeAuth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch transcripts server-side with most recent call ID
  const transcripts = await prisma.transcript.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      filename: true,
      status: true,
      source: true,
      skipTranscription: true,
      durationSeconds: true,
      language: true,
      qualityScore: true,
      createdAt: true,
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <TranscriptsPageContent transcripts={transcriptsData} />
      </div>
    </div>
  );
}
