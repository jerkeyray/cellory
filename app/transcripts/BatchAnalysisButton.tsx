"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BatchAnalysisButtonProps {
  selectedIds: string[];
  onClearSelection: () => void;
  totalUnanalyzed: number;
}

export default function BatchAnalysisButton({
  selectedIds,
  onClearSelection,
  totalUnanalyzed,
}: BatchAnalysisButtonProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  const handleBatchAnalyze = async () => {
    setAnalyzing(true);

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

      toast.success(`Analyzing ${selectedIds.length} transcript${selectedIds.length === 1 ? "" : "s"}...`);

      // Clear selection and redirect
      onClearSelection();
      router.push("/calls");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze transcripts");
      setAnalyzing(false);
    }
  };

  if (selectedIds.length === 0 && totalUnanalyzed === 0) return null;

  return (
    <Button
      onClick={handleBatchAnalyze}
      disabled={analyzing || selectedIds.length === 0}
      className="gap-2"
      size="default"
    >
      {analyzing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          {selectedIds.length > 0
            ? `Analyze ${selectedIds.length} Selected`
            : `Analyze Transcripts (${totalUnanalyzed})`}
        </>
      )}
    </Button>
  );
}
