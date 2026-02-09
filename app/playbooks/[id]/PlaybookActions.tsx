"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlaybookActionsProps {
  playbookId: string;
  content: string;
}

export default function PlaybookActions({ playbookId, content }: PlaybookActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playbook-${playbookId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/playbooks/${playbookId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete playbook");

      router.push("/playbooks");
      router.refresh();
    } catch (err) {
      console.error("Error deleting playbook:", err);
      alert("Failed to delete playbook");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-[#999] dark:hover:bg-[#1a1a1a]"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg
                className="h-4 w-4 text-green-600"
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
              Copied!
            </>
          ) : (
            <>
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-[#999] dark:hover:bg-[#1a1a1a]"
          title="Export as Markdown"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </button>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          title="Delete playbook"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-xl dark:border-[#2a2a2a] dark:bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-white">
              Delete Playbook
            </h3>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Are you sure you want to delete this playbook? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-[#e5e5e5] px-4 py-2.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2a2a2a] dark:text-white dark:hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
