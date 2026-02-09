import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TranscriptRedirect({
  params
}: {
  params: { id: string }
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the transcript to verify ownership
  const transcript = await prisma.transcript.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    },
    include: {
      calls: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true }
      }
    }
  });

  if (!transcript) {
    // Transcript doesn't exist or doesn't belong to user
    redirect("/transcripts");
  }

  // If transcript has been analyzed, redirect to most recent call
  if (transcript.calls.length > 0) {
    redirect(`/calls/${transcript.calls[0].id}`);
  }

  // Otherwise, redirect to analyze page
  redirect(`/calls/new?transcriptId=${transcript.id}`);
}
