import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export default async function Home() {
  const session = await auth();

  // If not signed in, redirect to sign-in page
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch real stats
  const transcriptsCount = await prisma.transcript.count();
  const callsCount = await prisma.call.count({ where: { status: "complete" } });
  const playbooksCount = await prisma.playbook.count();

  const successCalls = await prisma.call.count({
    where: { status: "complete", outcome: "success" },
  });
  const totalCompleteCalls = await prisma.call.count({
    where: { status: "complete" },
  });
  const successRate =
    totalCompleteCalls > 0
      ? ((successCalls / totalCompleteCalls) * 100).toFixed(1)
      : "—";

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-[#1a1a1a] dark:text-white">
            Welcome to Cellory
          </h1>
          <p className="mt-4 text-lg text-[#666] dark:text-[#999]">
            Convert unstructured call recordings into structured, auditable
            insights
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Upload Audio */}
          <Link
            href="/transcripts"
            className="group rounded-2xl border border-[#e5e5e5] bg-white p-8 transition-all hover:border-[#ff6b35] hover:shadow-lg dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b35] bg-opacity-10">
              <svg
                className="h-6 w-6 text-[#ff6b35]"
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
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#1a1a1a] dark:text-white">
              Upload Audio
            </h2>
            <p className="text-sm text-[#666] dark:text-[#999]">
              Upload financial call recordings and convert them to transcripts
            </p>
          </Link>

          {/* Analyze Calls */}
          <Link
            href="/calls"
            className="group rounded-2xl border border-[#e5e5e5] bg-white p-8 transition-all hover:border-[#ff6b35] hover:shadow-lg dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b35] bg-opacity-10">
              <svg
                className="h-6 w-6 text-[#ff6b35]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#1a1a1a] dark:text-white">
              Analyze Calls
            </h2>
            <p className="text-sm text-[#666] dark:text-[#999]">
              Extract behavioral signals and analyze call patterns
            </p>
          </Link>

          {/* View Playbooks */}
          <Link
            href="/playbooks"
            className="group rounded-2xl border border-[#e5e5e5] bg-white p-8 transition-all hover:border-[#ff6b35] hover:shadow-lg dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b35] bg-opacity-10">
              <svg
                className="h-6 w-6 text-[#ff6b35]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#1a1a1a] dark:text-white">
              View Playbooks
            </h2>
            <p className="text-sm text-[#666] dark:text-[#999]">
              Generated behavioral guidance from analyzed calls
            </p>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-3xl font-bold text-[#ff6b35]">{transcriptsCount}</div>
            <div className="mt-1 text-sm text-[#666] dark:text-[#999]">
              Transcripts
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-3xl font-bold text-[#ff6b35]">{callsCount}</div>
            <div className="mt-1 text-sm text-[#666] dark:text-[#999]">
              Calls Analyzed
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-3xl font-bold text-[#ff6b35]">{playbooksCount}</div>
            <div className="mt-1 text-sm text-[#666] dark:text-[#999]">
              Playbooks Generated
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-3xl font-bold text-[#ff6b35]">
              {typeof successRate === "string" ? successRate : `${successRate}%`}
            </div>
            <div className="mt-1 text-sm text-[#666] dark:text-[#999]">
              Success Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
