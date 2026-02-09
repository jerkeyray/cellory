"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BatchAnalysisBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  totalUnanalyzed: number;
}

export default function BatchAnalysisBar({
  selectedIds,
  onClearSelection,
  totalUnanalyzed,
}: BatchAnalysisBarProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBatchAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/calls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptIds: selectedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start batch analysis");
      }

      // Clear selection and refresh
      onClearSelection();
      router.push("/calls");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to analyze transcripts");
      setAnalyzing(false);
    }
  };

  if (selectedIds.length === 0 && totalUnanalyzed === 0) return null;

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
            Batch Analysis
          </h3>
          <p className="mt-1 text-sm text-[#666] dark:text-[#999]">
            {selectedIds.length > 0 ? (
              <>
                {selectedIds.length} transcript{selectedIds.length === 1 ? "" : "s"} selected
              </>
            ) : (
              <>
                {totalUnanalyzed} unanalyzed transcript{totalUnanalyzed === 1 ? "" : "s"} available
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={onClearSelection}
                disabled={analyzing}
                className="text-sm text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white disabled:opacity-50"
              >
                Clear selection
              </button>
              <button
                onClick={handleBatchAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 rounded-lg bg-[#ff6b35] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Analyze {selectedIds.length} Transcript{selectedIds.length === 1 ? "" : "s"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {selectedIds.length === 0 && totalUnanalyzed > 0 && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Select transcripts below using the checkboxes to analyze multiple at once. This will automatically extract behavioral signals and determine call outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
