"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Playbook {
  id: string;
  title: string;
  content: string;
  callCount: number;
  confidenceScores: any;
  createdAt: string;
}

interface PlaybooksClientProps {
  playbooks: Playbook[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlaybooksClient({ playbooks }: PlaybooksClientProps) {
  const router = useRouter();
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, playbookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModalId(playbookId);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/playbooks/${deleteModalId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete playbook");
      }

      setDeleteModalId(null);
      setDeleting(false);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete playbook");
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalId(null);
    setDeleteError(null);
  };

  const playbookToDelete = playbooks.find((p) => p.id === deleteModalId);

  return (
    <>
      <div className="grid gap-6">
        {playbooks.map((playbook) => {
          const confidenceScores = playbook.confidenceScores as any;

          return (
            <div
              key={playbook.id}
              className="group relative block rounded-xl border border bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md"
            >
              <Link href={`/playbooks/${playbook.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ff6b35]">
                      {playbook.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(playbook.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {playbook.callCount} calls
                      </div>
                      {confidenceScores && (
                        <div className="flex items-center gap-1">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Data Quality: {(confidenceScores.dataQuality * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                      {playbook.content.split("\n").find((line) => line.trim() && !line.startsWith("#"))}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, playbook.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      title="Delete playbook"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <svg
                      className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#ff6b35]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteModalId} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Playbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{playbookToDelete?.title}</strong>?
              This action cannot be undone.
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
