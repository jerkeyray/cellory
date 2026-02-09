import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import CallsListClient from "./CallsListClient";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function CallsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch calls server-side with all necessary data
  const calls = await prisma.call.findMany({
    where: { userId: session.user.id },
    include: {
      transcript: {
        select: {
          filename: true,
          durationSeconds: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: { signals: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Pre-calculate stats server-side
  const stats = {
    total: calls.length,
    success: calls.filter((c) => c.outcome === "success").length,
    failure: calls.filter((c) => c.outcome === "failure").length,
  };

  // Check if we should show playbook generation prompt
  const playbooksCount = await prisma.playbook.count({
    where: { userId: session.user.id },
  });
  const showPlaybookPrompt = calls.length >= 3 && playbooksCount === 0;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Call Analysis"
          description="Behavioral analysis results from your recordings"
          actions={
            <>
              {showPlaybookPrompt && (
                <Button variant="outline" asChild>
                  <Link href="/compare">Generate Playbook</Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/calls/new" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Analyze Recording
                </Link>
              </Button>
            </>
          }
        />

        {/* Client component handles filtering and rendering */}
        <CallsListClient calls={calls} stats={stats} />
      </div>
    </div>
  );
}
