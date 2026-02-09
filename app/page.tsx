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
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-foreground">Cellory</span>
          <Button asChild size="sm">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            Financial Audio Intelligence
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Turn call recordings into{" "}
            <span className="text-primary">actionable intelligence</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Cellory converts unstructured financial call audio into structured,
            auditable insights and data-driven coaching playbooks. Stop guessing
            what works — let the data show you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/signin">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Behavioral Signals</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Extract objections, escalations, agreements, and resolution
                patterns from every call automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Outcome Comparison</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Compare successful vs failed calls side-by-side to identify what
                separates top performers.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Coaching Playbooks</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate data-driven coaching guides that improve with every call
                you process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              How Cellory Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              A two-stage pipeline that converts raw audio into structured
              intelligence — fast, testable, and auditable.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </span>
                  <CardTitle className="text-lg">Upload</CardTitle>
                </div>
                <CardDescription>
                  Drop in your call recordings — WAV, MP3, or M4A. Cellory
                  transcribes them via Whisper and extracts audio metadata
                  automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                  <Mic className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">sales-call-047.mp3</div>
                    <div className="text-muted-foreground">
                      12:34 duration &middot; English
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </span>
                  <CardTitle className="text-lg">Analyze</CardTitle>
                </div>
                <CardDescription>
                  The intelligence pipeline chunks transcripts, extracts
                  behavioral signals with GPT-4o, and aggregates them
                  deterministically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                    <span>Objections detected</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                    <span>Resolution attempts</span>
                    <Badge variant="secondary">5</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                    <span>Agreements reached</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </span>
                  <CardTitle className="text-lg">Generate</CardTitle>
                </div>
                <CardDescription>
                  Cross-call patterns are compared across outcomes. Coaching
                  playbooks are generated with historical context from
                  persistent memory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <div className="mb-2 font-medium">
                    Collections Playbook v3
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>
                      &bull; Lead with empathy in first 30 seconds
                    </div>
                    <div>
                      &bull; Acknowledge constraints before proposing
                    </div>
                    <div>&bull; Offer two options, not ultimatums</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Built for Financial Teams
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for collections, support, and sales call analysis in
              financial organizations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Layers className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Deterministic Aggregation
                </CardTitle>
                <CardDescription>
                  Signal counts, timing distributions, and sequence detection
                  are computed deterministically — no LLM variability.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Persistent Memory
                </CardTitle>
                <CardDescription>
                  Cross-call intelligence compounds over time through Backboard
                  AI, so playbooks improve with every call.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Auditable Pipeline
                </CardTitle>
                <CardDescription>
                  Every signal, aggregate, and comparison is stored and
                  reviewable. Full transparency from audio to insight.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Upload className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">Bulk Upload</CardTitle>
                <CardDescription>
                  Upload multiple recordings at once with automatic
                  transcription and optional auto-analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">Batch Analysis</CardTitle>
                <CardDescription>
                  Select and analyze dozens of calls at once. Tag outcomes and
                  let the pipeline process them in parallel.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Outcome Insights
                </CardTitle>
                <CardDescription>
                  See aggregate trends, success vs failure patterns, and
                  performance benchmarks across your call library.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Modern Stack
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built with production-grade tools for speed, reliability, and
              scale.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {[
                "Next.js 16",
                "GPT-4o",
                "Whisper",
                "Vercel AI SDK",
                "Neon Postgres",
                "Prisma",
                "Backboard AI",
                "Tailwind CSS",
              ].map((tech) => (
                <Badge key={tech} variant="outline" className="px-3 py-1 text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-background">
              Ready to unlock your call data?
            </h2>
            <p className="mt-4 text-background/60">
              Start converting unstructured recordings into structured
              intelligence in minutes.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 gap-2"
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
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm font-semibold text-foreground">
              Cellory
            </span>
            <p className="text-xs text-muted-foreground">
              Built for Hotfoot AI Challenge 1: Financial Audio Intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard (authenticated)
// ---------------------------------------------------------------------------

async function Dashboard({ userId }: { userId: string }) {
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
      : "\u2014";

  const showPlaybookPrompt = callsCount >= 3 && playbooksCount === 0;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Call Intelligence Dashboard
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Turn call recordings into actionable coaching insights
          </p>
        </div>

        {/* Contextual Playbook Prompt */}
        {showPlaybookPrompt && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Ready to generate your first playbook?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have {callsCount} analyzed calls. Generate a coaching
                    playbook from your call patterns.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/playbooks">Generate Playbook</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {transcriptsCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Calls Analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {callsCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Playbooks Generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {playbooksCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {typeof successRate === "string"
                  ? successRate
                  : `${successRate}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group transition-all hover:border-primary hover:shadow-md">
            <Link href="/transcripts">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Upload Recordings</CardTitle>
                <CardDescription>
                  Add call recordings for automatic transcription and analysis
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="group transition-all hover:border-primary hover:shadow-md">
            <Link href="/calls">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Call Analysis</CardTitle>
                <CardDescription>
                  View behavioral signals, patterns, and call outcomes
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="group transition-all hover:border-primary hover:shadow-md">
            <Link href="/playbooks">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Coaching Playbooks</CardTitle>
                <CardDescription>
                  Data-driven coaching playbooks from your call library
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
