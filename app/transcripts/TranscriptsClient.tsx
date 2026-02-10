"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload02Icon, CheckmarkCircle02Icon, Clock01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import BatchAnalysisButton from "./BatchAnalysisButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatRelativeTime, formatDuration } from "@/lib/formatters";

interface Transcript {
  id: string;
  filename: string;
  status: "processing" | "ready" | "error";
  source: string;
  skipTranscription: boolean;
  durationSeconds: number | null;
  language: string | null;
  qualityScore: number | null;
  createdAt: string;
  mostRecentCallId: string | null;
  _count: {
    calls: number;
  };
}

interface TranscriptsClientProps {
  transcripts: Transcript[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function TranscriptsClient({ transcripts, selectedIds, onSelectionChange }: TranscriptsClientProps) {
  const router = useRouter();
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const hasProcessing = transcripts.some((t) => t.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasProcessing, router]);

  // Filter transcripts that are ready but not analyzed
  const unanalyzedTranscripts = transcripts.filter(
    (t) => t.status === "ready" && t._count.calls === 0
  );

  const toggleSelection = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  const selectAll = () => {
    onSelectionChange(unanalyzedTranscripts.map((t) => t.id));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "processing":
        return "default";
      case "ready":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const isAnalyzed = (transcript: Transcript) => transcript._count.calls > 0;
  const canSelect = (transcript: Transcript) =>
    transcript.status === "ready" && !isAnalyzed(transcript);

  const getQualityDot = (qualityScore: number | null) => {
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
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs text-muted-foreground">
          Quality: {Math.round(qualityScore * 100)}%
        </span>
      </div>
    );
  };

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
      setDeleting(false);
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

  const handleTranscriptClick = (transcript: Transcript) => {
    // If transcript is processing or errored, do nothing
    if (transcript.status === "processing" || transcript.status === "error") {
      return;
    }

    // If transcript has been analyzed, navigate to most recent call
    if (transcript.mostRecentCallId) {
      router.push(`/calls/${transcript.mostRecentCallId}`);
    } else {
      // Otherwise, navigate to analyze page
      router.push(`/calls/new?transcriptId=${transcript.id}`);
    }
  };

  return (
    <>
      {/* Bulk Actions */}
      {unanalyzedTranscripts.length > 0 && selectedIds.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} Selected
          </div>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
      )}

      {unanalyzedTranscripts.length > 0 && selectedIds.length === 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {unanalyzedTranscripts.length} Ready for Analysis
          </div>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All Unanalyzed
          </Button>
        </div>
      )}

      {/* Transcripts List */}
      {transcripts.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <HugeiconsIcon icon={Upload02Icon} className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No recordings yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload your first call recording to get started
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {transcripts.map((transcript) => (
            <Card
              key={transcript.id}
              className={`group relative transition-all hover:shadow-sm ${
                selectedIds.includes(transcript.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-stone-300"
              }`}
            >
              <div className="flex items-start gap-4 p-3">
                {/* Checkbox */}
                {canSelect(transcript) && (
                  <div className="flex-shrink-0 pt-0.5">
                    <Checkbox
                      checked={selectedIds.includes(transcript.id)}
                      onCheckedChange={() => toggleSelection(transcript.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  onClick={() => handleTranscriptClick(transcript)}
                  className={`block flex-1 min-w-0 ${
                    transcript.status === "ready" ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-medium truncate">
                          {transcript.filename}
                        </h3>
                        {transcript.skipTranscription && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Imported</Badge>
                        )}
                        {isAnalyzed(transcript) && (
                          <Badge variant="secondary" className="gap-1 bg-green-50 text-green-700 border-green-200">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
                            Analyzed
                          </Badge>
                        )}
                        {!isAnalyzed(transcript) && transcript.status === "ready" && (
                          <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                            <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3" />
                            Ready to Analyze
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <Badge variant={getStatusBadgeVariant(transcript.status)} className={
                          transcript.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          transcript.status === "ready" ? "bg-green-50 text-green-700 border-green-200" :
                          transcript.status === "error" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-stone-50 text-stone-700 border-stone-200"
                        }>
                          {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                        </Badge>
                        {transcript.durationSeconds && (
                          <span>{formatDuration(transcript.durationSeconds)}</span>
                        )}
                        {transcript.language && (
                          <span>{transcript.language.toUpperCase()}</span>
                        )}
                        {transcript.qualityScore !== null && transcript.qualityScore !== undefined && getQualityDot(transcript.qualityScore)}
                        <span>
                          {formatRelativeTime(transcript.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {transcript.skipTranscription && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`/api/transcripts/${transcript.id}?format=csv`, "_blank");
                          }}
                        >
                          Download CSV
                        </Button>
                      )}
                      {!transcript.skipTranscription && transcript.status === "ready" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`/api/transcripts/${transcript.id}?format=csv`, "_blank");
                          }}
                        >
                          Download CSV
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => handleDelete(e, transcript.id)}
                        className="text-muted-foreground hover:text-destructive hover:border-destructive"
                        title="Delete transcript"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteModalId} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transcript</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{transcriptToDelete?.filename}</strong>?
              {transcriptToDelete && transcriptToDelete._count.calls > 0 && (
                <span className="mt-2 block text-destructive">
                  This will also delete {transcriptToDelete._count.calls} associated call
                  {transcriptToDelete._count.calls === 1 ? "" : "s"}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
