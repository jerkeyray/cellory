"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface Call {
  id: string;
  outcome: "success" | "failure";
  status: string;
  createdAt: string;
}

interface Transcript {
  id: string;
  filename: string;
  content: string;
  status: "processing" | "ready" | "error";
  durationSeconds: number | null;
  language: string | null;
  qualityScore: number | null;
  wordTimestamps: WordTimestamp[] | null;
  createdAt: string;
  calls: Call[];
}

export default function TranscriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTranscript();
  }, [params.id]);

  const fetchTranscript = async () => {
    try {
      const res = await fetch(`/api/transcripts/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch transcript");
      const data = await res.json();
      setTranscript(data);
    } catch (err) {
      setError("Failed to load transcript");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transcript? This will also delete all associated call analyses.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/transcripts/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transcript");

      router.push("/transcripts");
    } catch (err) {
      setError("Failed to delete transcript");
      setDeleting(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[status as keyof typeof styles] || ""
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Transcript not found"}</p>
          <Link
            href="/transcripts"
            className="mt-4 inline-block text-sm text-[#ff6b35] hover:underline"
          >
            Back to Transcripts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/transcripts"
            className="inline-flex items-center text-sm text-[#666] hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Transcripts
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
                {transcript.filename}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-[#666] dark:text-[#999]">
                {getStatusBadge(transcript.status)}
                <span>{formatDate(transcript.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-[#1a1a1a] dark:text-red-400 dark:hover:bg-red-950"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Transcript Content */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Transcript
              </h2>

              {transcript.status === "processing" ? (
                <div className="py-12 text-center text-[#666] dark:text-[#999]">
                  Transcription in progress... Refresh the page to check status.
                </div>
              ) : transcript.status === "error" ? (
                <div className="py-12 text-center text-red-600 dark:text-red-400">
                  Transcription failed. Please try uploading again.
                </div>
              ) : (
                <div className="space-y-2">
                  {transcript.content.split('\n').filter(line => line.trim()).map((line, i) => {
                    const isAgent = line.trim().startsWith('Agent:');
                    const isCustomer = line.trim().startsWith('Customer:');

                    if (!isAgent && !isCustomer) return null;

                    // Estimate timestamp (rough approximation based on line position)
                    const estimatedTime = transcript.durationSeconds
                      ? Math.floor((i / transcript.content.split('\n').length) * transcript.durationSeconds)
                      : i * 5;
                    const minutes = Math.floor(estimatedTime / 60);
                    const seconds = estimatedTime % 60;
                    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                    const text = line.replace(/^(Agent:|Customer:)\s*/, '');

                    return (
                      <div
                        key={i}
                        className="flex gap-3 py-2"
                      >
                        <div className="flex-shrink-0 w-16 text-xs text-[#999] font-mono pt-0.5">
                          {timestamp}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-[#666] dark:text-[#999]">
                            {isAgent ? 'Agent' : 'Customer'}
                          </span>
                          <p className="mt-1 text-sm text-[#1a1a1a] dark:text-white">
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Analyze Call Button */}
            {transcript.status === "ready" && (
              <Link
                href={`/calls/new?transcriptId=${transcript.id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
              >
                <svg
                  className="h-4 w-4"
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
                Analyze Call
              </Link>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] dark:text-white">
                Metadata
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Duration</dt>
                  <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                    {formatDuration(transcript.durationSeconds)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Language</dt>
                  <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                    {transcript.language?.toUpperCase() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Word Count</dt>
                  <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                    {transcript.content.split(/\s+/).length}
                  </dd>
                </div>
                {transcript.wordTimestamps && (
                  <div>
                    <dt className="text-[#666] dark:text-[#999]">Timestamps</dt>
                    <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                      {transcript.wordTimestamps.length} words
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Associated Calls */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] dark:text-white">
                Call Analyses ({transcript.calls.length})
              </h3>

              {transcript.calls.length === 0 ? (
                <p className="text-sm text-[#666] dark:text-[#999]">
                  No analyses yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transcript.calls.map((call) => (
                    <Link
                      key={call.id}
                      href={`/calls/${call.id}`}
                      className="block rounded-lg border border-[#e5e5e5] p-3 text-sm transition-colors hover:border-[#ff6b35] dark:border-[#2a2a2a] dark:hover:border-[#ff6b35]"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium ${
                            call.outcome === "success"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {call.outcome === "success" ? "✓ Success" : "✗ Failure"}
                        </span>
                        <span className="text-[#999]">
                          {formatDate(call.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
