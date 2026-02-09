"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Batch Analysis</h3>
            <p className="mt-1 text-sm text-muted-foreground">
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
                <Button
                  variant="ghost"
                  onClick={onClearSelection}
                  disabled={analyzing}
                >
                  Clear selection
                </Button>
                <Button
                  onClick={handleBatchAnalyze}
                  disabled={analyzing}
                  className="gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Analyze {selectedIds.length} Transcript{selectedIds.length === 1 ? "" : "s"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedIds.length === 0 && totalUnanalyzed > 0 && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Select transcripts below using the checkboxes to analyze multiple at once. This will automatically extract behavioral signals and determine call outcomes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
