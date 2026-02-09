"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Clock, Trash2 } from "lucide-react";
import BatchAnalysisBar from "./BatchAnalysisBar";
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
import { formatDate, formatDuration } from "@/lib/formatters";

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
          <div className="text-sm text-muted-foreground">
            {selectedIds.length > 0 ? (
              <>{selectedIds.length} selected</>
            ) : (
              <>{unanalyzedTranscripts.length} ready for analysis</>
            )}
          </div>
          {unanalyzedTranscripts.length > 0 && selectedIds.length === 0 && (
            <Button variant="link" size="sm" onClick={selectAll}>
              Select all unanalyzed
            </Button>
          )}
        </div>
      )}

      {/* Transcripts List */}
      {transcripts.length === 0 ? (
        <Card className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No recordings yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload your first call recording to get started
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <Card
              key={transcript.id}
              className={`group relative transition-all hover:shadow-md ${
                selectedIds.includes(transcript.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary"
              }`}
            >
              <div className="flex items-start gap-4 p-6">
                {/* Checkbox */}
                {canSelect(transcript) && (
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox
                      checked={selectedIds.includes(transcript.id)}
                      onCheckedChange={() => toggleSelection(transcript.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Content */}
                <Link
                  href={`/transcripts/${transcript.id}`}
                  className="block flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold truncate">
                          {transcript.filename}
                        </h3>
                        {isAnalyzed(transcript) && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Analyzed
                          </Badge>
                        )}
                        {!isAnalyzed(transcript) && transcript.status === "ready" && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Ready to analyze
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <Badge variant={getStatusBadgeVariant(transcript.status)}>
                          {transcript.status}
                        </Badge>
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
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDate(transcript.createdAt)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, transcript.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        title="Delete transcript"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Link>
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
