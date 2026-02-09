"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CallListItemProps {
  call: {
    id: string;
    outcome: "success" | "failure";
    status: string;
    createdAt: Date;
    transcript: {
      filename: string;
      durationSeconds: number | null;
      qualityScore: number | null;
    };
    tags: Array<{
      id: string;
      name: string;
      color: string | null;
    }>;
    _count: {
      signals: number;
    };
  };
}

function getStatusBadge(status: string) {
  const styles = {
    pending: "bg-gray-100 text-gray-800",
    extracting: "bg-blue-100 text-blue-800",
    aggregating:
      "bg-purple-100 text-purple-800",
    complete: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
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
}

function getOutcomeBadge(outcome: string) {
  return outcome === "success" ? (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
      Success
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
      Failure
    </span>
  );
}

function getQualityDot(qualityScore: number | null) {
  if (qualityScore === null || qualityScore === undefined) {
    return null;
  }

  const color =
    qualityScore >= 0.7
      ? "bg-green-500"
      : qualityScore >= 0.4
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} title={`Quality: ${Math.round(qualityScore * 100)}%`} />
    </span>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CallListItem({ call }: CallListItemProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/calls/${call.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete call");
      }

      // Close modal and refresh the page
      setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete call");
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
      <div className="group relative rounded-xl border border bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md">
        <Link href={`/calls/${call.id}`} className="block">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {getOutcomeBadge(call.outcome)}
                {getStatusBadge(call.status)}
                {getQualityDot(call.transcript.qualityScore)}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {call.transcript.filename}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>Signals: {call._count.signals}</span>
                {call.transcript.durationSeconds && (
                  <span>
                    Duration:{" "}
                    {Math.floor(call.transcript.durationSeconds / 60)}:
                    {(call.transcript.durationSeconds % 60)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                )}
              </div>
              {/* Tags */}
              {call.tags && call.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {call.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || "#999" }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-muted-foreground">
                {formatDate(call.createdAt)}
              </div>
              <button
                onClick={handleDelete}
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                title="Delete call"
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
            className="mx-4 w-full max-w-md rounded-xl border border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-foreground">
              Delete Call Analysis
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete the call analysis for{" "}
              <strong>{call.transcript.filename}</strong>?
              <span className="mt-2 block text-red-600">
                This will also delete {call._count.signals} signal
                {call._count.signals === 1 ? "" : "s"} and all aggregates.
              </span>
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 rounded-lg border border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
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
