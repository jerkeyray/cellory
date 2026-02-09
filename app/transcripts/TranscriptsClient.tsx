"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BatchAnalysisBar from "./BatchAnalysisBar";

interface Transcript {
  id: string;
  filename: string;
  status: "processing" | "ready" | "error";
  durationSeconds: number | null;
  language: string | null;
  createdAt: string;
  _count: {
    calls: number;
  };
}

interface TranscriptsClientProps {
  transcripts: Transcript[];
}

export default function TranscriptsClient({ transcripts }: TranscriptsClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter transcripts that are ready but not analyzed
  const unanalyzedTranscripts = transcripts.filter(
    (t) => t.status === "ready" && t._count.calls === 0
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(unanalyzedTranscripts.map((t) => t.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
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

  const isAnalyzed = (transcript: Transcript) => transcript._count.calls > 0;
  const canSelect = (transcript: Transcript) =>
    transcript.status === "ready" && !isAnalyzed(transcript);

  const handleDelete = (e: React.MouseEvent, transcriptId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModalId(transcriptId);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/transcripts/${deleteModalId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete transcript");
      }

      setDeleteModalId(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete transcript");
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalId(null);
    setDeleteError(null);
  };

  const transcriptToDelete = transcripts.find((t) => t.id === deleteModalId);

  return (
    <>
      {/* Batch Analysis Bar */}
      {unanalyzedTranscripts.length > 0 && (
        <div className="mb-6">
          <BatchAnalysisBar
            selectedIds={selectedIds}
            onClearSelection={clearSelection}
            totalUnanalyzed={unanalyzedTranscripts.length}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {unanalyzedTranscripts.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-[#666] dark:text-[#999]">
            {selectedIds.length > 0 ? (
              <>{selectedIds.length} selected</>
            ) : (
              <>{unanalyzedTranscripts.length} ready for analysis</>
            )}
          </div>
          {unanalyzedTranscripts.length > 0 && selectedIds.length === 0 && (
            <button
              onClick={selectAll}
              className="text-sm text-[#ff6b35] hover:underline"
            >
              Select all unanalyzed
            </button>
          )}
        </div>
      )}

      {/* Transcripts List */}
      {transcripts.length === 0 ? (
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-12 text-center dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <svg
            className="mx-auto h-12 w-12 text-[#999]"
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
          <h3 className="mt-4 text-lg font-medium text-[#1a1a1a] dark:text-white">
            No transcripts yet
          </h3>
          <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
            Upload your first audio file to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className={`group relative rounded-xl border bg-white transition-all hover:shadow-md dark:bg-[#0a0a0a] ${
                selectedIds.includes(transcript.id)
                  ? "border-[#ff6b35] bg-[#fff5f2] dark:border-[#ff6b35] dark:bg-[#1a0f0a]"
                  : "border-[#e5e5e5] hover:border-[#ff6b35] dark:border-[#2a2a2a] dark:hover:border-[#ff6b35]"
              }`}
            >
              <div className="flex items-start gap-4 p-6">
                {/* Checkbox - Improved UI */}
                {canSelect(transcript) && (
                  <label className="flex-shrink-0 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(transcript.id)}
                      onChange={() => toggleSelection(transcript.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 cursor-pointer rounded border-2 border-[#e5e5e5] text-[#ff6b35] transition-all hover:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2 dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
                    />
                  </label>
                )}

                {/* Content */}
                <Link
                  href={`/transcripts/${transcript.id}`}
                  className="block flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white truncate">
                          {transcript.filename}
                        </h3>
                        {isAnalyzed(transcript) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Analyzed
                          </span>
                        )}
                        {!isAnalyzed(transcript) && transcript.status === "ready" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Ready to analyze
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-[#666] dark:text-[#999] flex-wrap">
                        <span>{getStatusBadge(transcript.status)}</span>
                        {transcript.durationSeconds && (
                          <span>Duration: {formatDuration(transcript.durationSeconds)}</span>
                        )}
                        {transcript.language && (
                          <span>Language: {transcript.language.toUpperCase()}</span>
                        )}
                        <span>
                          {isAnalyzed(transcript)
                            ? `${transcript._count.calls} analysis`
                            : "Not analyzed"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right text-sm text-[#999]">
                        {formatDate(transcript.createdAt)}
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, transcript.id)}
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
            </div>
          ))}
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {deleteModalId && transcriptToDelete && (
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
                Are you sure you want to delete <strong>{transcriptToDelete.filename}</strong>?
                {transcriptToDelete._count.calls > 0 && (
                  <span className="mt-2 block text-red-600 dark:text-red-400">
                    This will also delete {transcriptToDelete._count.calls} associated call
                    {transcriptToDelete._count.calls === 1 ? "" : "s"}.
                  </span>
                )}
              </p>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {deleteError}
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
