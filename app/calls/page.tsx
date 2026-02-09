import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import CallsListClient from "./CallsListClient";

export default async function CallsPage() {
  // Fetch calls server-side with all necessary data
  const calls = await prisma.call.findMany({
    include: {
      transcript: {
        select: {
          filename: true,
          durationSeconds: true,
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

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
              Call Analyses
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Extract behavioral signals and patterns from calls
            </p>
          </div>

          <Link
            href="/calls/new"
            className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
          >
            New Analysis
          </Link>
        </div>

        {/* Client component handles filtering and rendering */}
        <CallsListClient calls={calls} stats={stats} />
      </div>
    </div>
  );
}
