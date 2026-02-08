"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Transcript {
  id: string;
  filename: string;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
}

export default function NewCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTranscriptId = searchParams.get("transcriptId");

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>(
    preselectedTranscriptId || ""
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const res = await fetch("/api/transcripts");
      if (!res.ok) throw new Error("Failed to fetch transcripts");
      const data = await res.json();
      // Only show ready transcripts
      setTranscripts(data.filter((t: Transcript) => t.status === "ready"));
    } catch (err) {
      setError("Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTranscriptId) {
      setError("Please select a transcript");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptId: selectedTranscriptId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create call");
      }

      const data = await res.json();

      // Redirect to call detail page
      router.push(`/calls/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create call");
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/calls"
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
            Back to Calls
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-[#1a1a1a] dark:text-white">
            New Call Analysis
          </h1>
          <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
            Select a transcript to analyze. AI will determine success/failure automatically.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transcript Selection */}
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <label className="mb-3 block text-sm font-semibold text-[#1a1a1a] dark:text-white">
              Select Transcript
            </label>

            {transcripts.length === 0 ? (
              <div className="rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-4 text-center text-sm text-[#666] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#999]">
                No ready transcripts available.{" "}
                <Link href="/transcripts" className="text-[#ff6b35] hover:underline">
                  Upload audio first
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {transcripts.map((transcript) => (
                  <label
                    key={transcript.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${
                      selectedTranscriptId === transcript.id
                        ? "border-[#ff6b35] bg-[#ff6b35] bg-opacity-5"
                        : "border-[#e5e5e5] hover:border-[#ff6b35] dark:border-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="transcript"
                        value={transcript.id}
                        checked={selectedTranscriptId === transcript.id}
                        onChange={(e) => setSelectedTranscriptId(e.target.value)}
                        className="h-4 w-4 accent-[#ff6b35]"
                      />
                      <div>
                        <div className="font-medium text-[#1a1a1a] dark:text-white">
                          {transcript.filename}
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#999]">
                          {transcript.durationSeconds
                            ? `${Math.floor(transcript.durationSeconds / 60)}:${(
                                transcript.durationSeconds % 60
                              )
                                .toString()
                                .padStart(2, "0")}`
                            : "Unknown duration"}{" "}
                          · {formatDate(transcript.createdAt)}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* AI Info */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">AI-Powered Analysis</p>
                <p>The system will automatically determine call success/failure based on markers like commitments, blockers, and resolutions detected in the transcript.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedTranscriptId}
            className="w-full rounded-lg bg-[#ff6b35] px-4 py-3 font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Starting Analysis..." : "Analyze Call"}
          </button>

          <p className="text-center text-xs text-[#999] dark:text-[#666]">
            Cost: ~$0.001-0.003 per analysis (gpt-4o-mini)
          </p>
        </form>
      </div>
    </div>
  );
}
