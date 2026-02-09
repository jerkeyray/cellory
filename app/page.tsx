import { auth } from "@/auth";
import Link from "next/link";
import {
  Upload,
  BarChart3,
  BookOpen,
  ArrowRight,
  Mic,
  Brain,
  Target,
  Layers,
  Shield,
  Zap,
} from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingFaq } from "@/components/LandingFaq";
import VantaGlobe from "./components/VantaGlobe";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    return <Dashboard userId={session.user.id!} />;
  }

  return <LandingPage />;
}

// ---------------------------------------------------------------------------
// Landing Page (unauthenticated)
// ---------------------------------------------------------------------------

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] pt-6 relative overflow-hidden">

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .btn-modern {
          border: 1px solid #d4d4d8;
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.7);
          transition: background-color 0.2s, color 0.2s;
        }
        .btn-modern:hover {
          background-color: #f4f4f5;
        }
        .btn-modern-primary {
           border: 1px solid #c2410c;
           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
           background-color: var(--primary);
           color: var(--primary-foreground);
        }
        .btn-modern-primary:hover {
           background-color: #ea580c;
        }
      `}</style>

      {/* Nav */}
      <nav className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between rounded-full border border-[#E4E4E7] bg-white pl-6 h-14 pr-1.5 py-1">
          <span className="text-xl font-bold text-foreground">Cellory</span>
          <Button
            asChild
            size="default"
            className="btn-modern-primary h-10 rounded-full px-5 mx-1 text-sm font-medium transition-colors hover:bg-orange-600"
          >
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[calc(100vh-120px)] flex items-center">
        <div className="mx-auto max-w-7xl px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left relative z-20">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Turn call recordings into actionable intelligence
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
                Cellory converts unstructured financial call audio into structured,
                auditable insights and data-driven coaching playbooks. Stop guessing
                what works. Let the data show you.
              </p>
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
                <Button
                  asChild
                  size="lg"
                  className="btn-modern-primary h-11 px-8 text-base gap-2 rounded-full"
                >
                  <Link href="/auth/signin">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="btn-modern h-11 px-8 text-base rounded-full bg-white border-transparent"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
            </div>

            {/* Right: Placeholder for spacing on desktop */}
            <div className="hidden lg:block" />
          </div>
        </div>

        {/* Vanta Globe - Absolute positioned to cover right side */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2 z-10">
          <VantaGlobe />
        </div>
      </section>

      {/* Value Props */}
      <section className="relative z-10 border-t border-dashed border-stone-300 bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="mb-16 text-center text-3xl font-semibold tracking-tight text-foreground">
            Turn conversations into <span className="text-[#ff6b35]">data</span>
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center md:text-left group">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 border border-[#ff6b35]/20 group-hover:border-[#ff6b35]/40 transition-colors">
                <Brain className="h-6 w-6 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-medium">Behavioral Signals</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Extract objections, escalations, agreements, and resolution
                patterns from every call automatically.
              </p>
            </div>
            <div className="text-center md:text-left group">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 border border-[#ff6b35]/20 group-hover:border-[#ff6b35]/40 transition-colors">
                <Target className="h-6 w-6 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-medium">Outcome Comparison</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Compare successful vs failed calls side-by-side to identify what
                separates top performers.
              </p>
            </div>
            <div className="text-center md:text-left group">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 border border-[#ff6b35]/20 group-hover:border-[#ff6b35]/40 transition-colors">
                <BookOpen className="h-6 w-6 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-medium">Coaching Playbooks</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Generate data-driven coaching guides that improve with every
                call you process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Timeline) */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-dashed border-stone-300"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              How Cellory <span className="text-[#ff6b35]">Works</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A two-stage pipeline that converts raw audio into structured
              intelligence. Fast, testable, and auditable.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-[#ff6b35]/50 via-[#ff6b35]/20 to-[#ff6b35]/50 md:left-1/2 md:-ml-px"></div>

            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right">
                  <h3 className="text-lg font-medium">Upload</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drop in your call recordings. Cellory transcribes them via
                    Whisper and extracts audio metadata automatically.
                  </p>
                </div>
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff6b35] bg-white text-sm font-bold text-[#ff6b35] md:left-1/2 md:-ml-4">
                  1
                </div>
                <div className="ml-12 mt-4 md:ml-0 md:mt-0 md:w-1/2 md:pl-12">
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-stone-400" />
                      <div className="text-sm">
                        <div className="font-medium">sales-call-047.mp3</div>
                        <div className="text-muted-foreground">12:34</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="order-2 ml-12 mt-4 md:order-1 md:ml-0 md:mt-0 md:w-1/2 md:pr-12">
                  <div className="rounded-lg border border-[#ff6b35]/20 bg-white p-4 hover:border-[#ff6b35]/40 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Objections</span>
                        <span className="rounded bg-[#ff6b35]/10 px-2 py-0.5 text-xs text-[#ff6b35] font-medium">
                          3 detected
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Resolution</span>
                        <span className="rounded bg-[#ff6b35]/10 px-2 py-0.5 text-xs text-[#ff6b35] font-medium">
                          5 attempts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff6b35] bg-white text-sm font-bold text-[#ff6b35] md:left-1/2 md:-ml-4">
                  2
                </div>
                <div className="order-1 ml-12 md:order-2 md:ml-0 md:w-1/2 md:pl-12">
                  <h3 className="text-lg font-medium">Analyze</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The pipeline extracts behavioral signals with GPT-4o and
                    aggregates them deterministically.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right">
                  <h3 className="text-lg font-medium">Generate</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cross-call patterns are compared. Playbooks are generated
                    with historical context.
                  </p>
                </div>
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff6b35] bg-white text-sm font-bold text-[#ff6b35] md:left-1/2 md:-ml-4">
                  3
                </div>
                <div className="ml-12 mt-4 md:ml-0 md:mt-0 md:w-1/2 md:pl-12">
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4">
                    <div className="text-sm">
                      <div className="mb-2 font-medium">
                        Collections Playbook
                      </div>
                      <div className="space-y-1 text-muted-foreground text-xs">
                        <div>• Lead with empathy</div>
                        <div>• Offer two options</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t border-dashed border-stone-300 bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Built for <span className="text-[#ff6b35]">Financial Teams</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Deterministic Aggregation",
                desc: "Signal counts and sequence detection computed deterministically.",
              },
              {
                icon: Brain,
                title: "Persistent Memory",
                desc: "Intelligence compounds over time through Backboard AI.",
              },
              {
                icon: Shield,
                title: "Auditable Pipeline",
                desc: "Every signal, aggregate, and comparison is stored and reviewable.",
              },
              {
                icon: Upload,
                title: "Bulk Upload",
                desc: "Upload multiple recordings at once with automatic transcription.",
              },
              {
                icon: Zap,
                title: "Batch Analysis",
                desc: "Select and analyze dozens of calls at once in parallel.",
              },
              {
                icon: BarChart3,
                title: "Outcome Insights",
                desc: "Trends and benchmarks across your call library.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group border border-stone-200 bg-white shadow-none transition-all hover:border-[#ff6b35]/30 hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 group-hover:from-[#ff6b35]/20 group-hover:to-[#ff6b35]/10 transition-colors">
                    <feature.icon className="h-5 w-5 text-[#ff6b35]" />
                  </div>
                  <CardTitle className="text-base font-medium">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack (Marquee) */}
      <section className="relative z-10 overflow-hidden border-t border-dashed border-stone-300 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-10 text-xl font-medium tracking-tight">
            Powered by <span className="text-[#ff6b35]">Modern Tech</span>
          </h2>
        </div>

        <div className="relative flex w-full overflow-hidden">
          <div className="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-12 px-6">
            {[
              "Next.js 16",
              "GPT-4o",
              "Whisper",
              "Vercel AI SDK",
              "Neon Postgres",
              "Prisma",
              "Backboard AI",
              "Tailwind CSS",
              "Next.js 16",
              "GPT-4o",
              "Whisper",
              "Vercel AI SDK",
            ].map((tech, i) => (
              <span
                key={i}
                className="text-lg font-medium text-muted-foreground/60 whitespace-nowrap"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-12 px-6">
            {[
              "Next.js 16",
              "GPT-4o",
              "Whisper",
              "Vercel AI SDK",
              "Neon Postgres",
              "Prisma",
              "Backboard AI",
              "Tailwind CSS",
              "Next.js 16",
              "GPT-4o",
              "Whisper",
              "Vercel AI SDK",
            ].map((tech, i) => (
              <span
                key={i}
                className="text-lg font-medium text-muted-foreground/60 whitespace-nowrap"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 border-t border-dashed border-stone-300 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight">
            FAQ
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Everything you need to know about Cellory
          </p>
          <LandingFaq />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-dashed border-stone-300 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border-2 border-[#ff6b35]/20 bg-gradient-to-br from-white to-[#ff6b35]/5 p-12 text-center shadow-lg">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Ready to unlock your <span className="text-[#ff6b35]">call data</span>?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start converting unstructured recordings into structured
              intelligence in minutes.
            </p>
            <Button
              asChild
              size="lg"
              className="btn-modern-primary mt-8 h-11 px-8 text-base rounded-full gap-2"
            >
              <Link href="/auth/signin">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <span className="text-lg font-bold text-foreground">Cellory</span>
          <p className="text-xs text-muted-foreground">
            © 2026 Cellory. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard (authenticated)
// ---------------------------------------------------------------------------

async function Dashboard({ userId }: { userId: string }) {
  // Stats
  const transcriptsCount = await prisma.transcript.count({
    where: { userId },
  });
  const callsCount = await prisma.call.count({
    where: { status: "complete", userId },
  });
  const playbooksCount = await prisma.playbook.count({
    where: { userId },
  });

  const successCalls = await prisma.call.count({
    where: { status: "complete", outcome: "success", userId },
  });
  const totalCompleteCalls = await prisma.call.count({
    where: { status: "complete", userId },
  });
  const successRate =
    totalCompleteCalls > 0
      ? ((successCalls / totalCompleteCalls) * 100).toFixed(1)
      : "0";

  // Recent calls
  const recentCalls = await prisma.call.findMany({
    where: { userId, status: "complete" },
    include: {
      transcript: {
        select: {
          filename: true,
          durationSeconds: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Recent playbooks
  const recentPlaybooks = await prisma.playbook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Processing transcripts
  const processingTranscripts = await prisma.transcript.findMany({
    where: { userId, status: "processing" },
    select: { filename: true, createdAt: true },
    take: 3,
  });

  const showPlaybookPrompt = callsCount >= 3 && playbooksCount === 0;
  const isEmpty = transcriptsCount === 0 && callsCount === 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your calls.
          </p>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <Card className="mb-8 border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Started with Cellory</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Upload your first call recording to start extracting insights and generating playbooks.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/transcripts">
                  <Upload className="h-4 w-4" />
                  Upload Recording
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contextual Playbook Prompt */}
        {showPlaybookPrompt && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    Ready to generate your first playbook?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have {callsCount} analyzed calls. Generate a data-driven coaching playbook from your call patterns.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/playbooks">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Generate Playbook
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Activity */}
        {processingTranscripts.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    Processing {processingTranscripts.length} recording{processingTranscripts.length > 1 ? 's' : ''}...
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {processingTranscripts.map(t => t.filename).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {transcriptsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total uploaded</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyzed Calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {callsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Signals extracted</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Success Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {successRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {successCalls} of {totalCompleteCalls} calls
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Playbooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {playbooksCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Coaching guides</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Calls - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Calls</CardTitle>
                  <CardDescription>Your latest analyzed calls</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/calls">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentCalls.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">No calls analyzed yet</p>
                    <Button asChild variant="link" size="sm" className="mt-2">
                      <Link href="/transcripts">Analyze your first call</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCalls.map((call) => (
                      <Link
                        key={call.id}
                        href={`/calls/${call.id}`}
                        className="block rounded-lg border border-stone-200 p-4 transition-all hover:border-primary hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{call.transcript.filename}</span>
                              <Badge
                                variant={
                                  call.outcome === "success"
                                    ? "default"
                                    : call.outcome === "failure"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs flex-shrink-0"
                              >
                                {call.outcome || "unknown"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {call.transcript.durationSeconds
                                ? `${Math.floor(call.transcript.durationSeconds / 60)}:${(Math.floor(call.transcript.durationSeconds) % 60).toString().padStart(2, '0')}`
                                : "—"}{" "}
                              · {new Date(call.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Playbooks - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/transcripts">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Recording
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/calls">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View All Calls
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/insights">
                    <Target className="h-4 w-4 mr-2" />
                    View Insights
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/playbooks">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Generate Playbook
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Playbooks */}
            {recentPlaybooks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Recent Playbooks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentPlaybooks.map((playbook) => (
                    <Link
                      key={playbook.id}
                      href={`/playbooks/${playbook.id}`}
                      className="block rounded-lg border border-stone-200 p-3 transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{playbook.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(playbook.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
