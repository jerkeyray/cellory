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
    <div className="min-h-screen bg-[#F2F2F2] pt-6 relative">
      {/* Diagonal Cross Grid Background - Top Right */}
      <div
        className="absolute top-0 right-0 w-full pointer-events-none z-0"
        style={{
          height: "600px",
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
        }}
      />

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
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-24">
        <div className="max-w-3xl text-center md:text-left">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Turn call recordings into actionable intelligence
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground md:text-left text-center">
            Cellory converts unstructured financial call audio into structured,
            auditable insights and data-driven coaching playbooks. Stop guessing
            what works. Let the data show you.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row md:justify-start justify-center">
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
      </section>

      {/* Value Props */}
      <section className="relative z-10 border-t border-dashed border-stone-300 bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="mb-16 text-center text-3xl font-semibold tracking-tight text-foreground">
            Turn conversations into data
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center md:text-left">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#E4E4E7]">
                <Brain className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium">Behavioral Signals</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Extract objections, escalations, agreements, and resolution
                patterns from every call automatically.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#E4E4E7]">
                <Target className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium">Outcome Comparison</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Compare successful vs failed calls side-by-side to identify what
                separates top performers.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#E4E4E7]">
                <BookOpen className="h-6 w-6 text-foreground" />
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
              How Cellory Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              A two-stage pipeline that converts raw audio into structured
              intelligence. Fast, testable, and auditable.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 h-full w-px bg-dashed bg-stone-300 md:left-1/2 md:-ml-px"></div>

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
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-bold md:left-1/2 md:-ml-4">
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
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Objections</span>
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-xs">
                          3 detected
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Resolution</span>
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-xs">
                          5 attempts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-bold md:left-1/2 md:-ml-4">
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
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-bold md:left-1/2 md:-ml-4">
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
              Built for Financial Teams
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
                className="border border-stone-200 bg-white shadow-none transition-all hover:bg-stone-50"
              >
                <CardHeader>
                  <feature.icon className="mb-3 h-5 w-5 text-foreground" />
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
          <h2 className="mb-10 text-xl font-medium tracking-tight opacity-70">
            Powered by Modern Tech
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
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
            Questions? We&apos;ve got answers.
          </h2>
          <LandingFaq />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-dashed border-stone-300 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Ready to unlock your call data?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start converting unstructured recordings into structured
              intelligence in minutes.
            </p>
            <Button
              asChild
              size="lg"
              className="btn-modern-primary mt-8 h-11 px-8 text-base rounded-full"
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
    <div className="min-h-screen bg-background">
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
