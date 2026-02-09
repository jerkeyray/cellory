"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Transcript {
  id: string;
  filename: string;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
}

export default function NewCallForm() {
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
        throw new Error(data.error || "Failed to create call analysis");
      }

      const result = await res.json();
      router.push(`/calls/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create call analysis");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Select Transcript */}
      <div>
        <label
          htmlFor="transcript"
          className="block text-sm font-medium text-[#1a1a1a] dark:text-white"
        >
          Select Transcript
        </label>
        <select
          id="transcript"
          value={selectedTranscriptId}
          onChange={(e) => setSelectedTranscriptId(e.target.value)}
          required
          className="mt-2 block w-full rounded-lg border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#ff6b35] focus:outline-none focus:ring-1 focus:ring-[#ff6b35] dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:text-white"
        >
          <option value="">Choose a transcript...</option>
          {transcripts.map((t) => (
            <option key={t.id} value={t.id}>
              {t.filename} ({formatDate(t.createdAt)})
            </option>
          ))}
        </select>
        {transcripts.length === 0 && (
          <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
            No ready transcripts available. Upload audio first.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting || !selectedTranscriptId}
          className="flex-1 rounded-lg bg-[#ff6b35] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating Analysis..." : "Start Analysis"}
        </button>
      </div>
    </form>
  );
}
