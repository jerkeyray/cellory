"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TranscriptListItemProps {
  transcript: {
    id: string;
    filename: string;
    status: "processing" | "ready" | "error";
    durationSeconds: number | null;
    language: string | null;
    createdAt: string;
    _count: {
      calls: number;
    };
  };
}

export default function TranscriptListItem({
  transcript,
}: TranscriptListItemProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/transcripts/${transcript.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete transcript");
      }

      // Close modal and refresh the page
      setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete transcript");
      setDeleting(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(false);
    setError(null);
  };

  return (
    <>
      <div className="group relative rounded-xl border border-[#e5e5e5] bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]">
        <Link href={`/transcripts/${transcript.id}`} className="block">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
                {transcript.filename}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-[#666] dark:text-[#999]">
                <span>{getStatusBadge(transcript.status)}</span>
                {transcript.durationSeconds && (
                  <span>
                    Duration: {formatDuration(transcript.durationSeconds)}
                  </span>
                )}
                {transcript.language && (
                  <span>Language: {transcript.language.toUpperCase()}</span>
                )}
                <span>Calls: {transcript._count.calls}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-[#999]">
                {formatDate(transcript.createdAt)}
              </div>
              <button
                onClick={handleDelete}
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg p-2 text-[#666] hover:bg-red-50 hover:text-red-600 dark:text-[#999] dark:hover:bg-red-950 dark:hover:text-red-400"
                title="Delete transcript"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={cancelDelete}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-xl dark:border-[#2a2a2a] dark:bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-white">
              Delete Transcript
            </h3>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Are you sure you want to delete <strong>{transcript.filename}</strong>?
              {transcript._count.calls > 0 && (
                <span className="mt-2 block text-red-600 dark:text-red-400">
                  This will also delete {transcript._count.calls} associated call
                  {transcript._count.calls === 1 ? "" : "s"}.
                </span>
              )}
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 rounded-lg border border-[#e5e5e5] px-4 py-2.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2a2a2a] dark:text-white dark:hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
