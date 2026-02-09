import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, BarChart3, BookOpen, TrendingUp } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // Check if we should show the playbook generation prompt
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
                  <h3 className="font-semibold">Ready to generate your first playbook?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have {callsCount} analyzed calls. Generate a coaching playbook from your call patterns.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/compare">Generate Playbook</Link>
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
              <CardDescription>Transcripts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{transcriptsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Calls Analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{callsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Playbooks Generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{playbooksCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {typeof successRate === "string" ? successRate : `${successRate}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Upload Recordings */}
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

          {/* Analyze Calls */}
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

          {/* View Playbooks */}
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
