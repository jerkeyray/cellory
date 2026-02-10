"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload02Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Loading03Icon,
  MusicNote01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UploadFile {
  file: File;
  id: string;
  inputType: "audio" | "import";
  status:
    | "pending"
    | "uploading"
    | "processing"
    | "ready"
    | "analyzing"
    | "complete"
    | "error";
  progress: number;
  transcriptId?: string;
  callId?: string;
  error?: string;
  pollCount?: number; // Track polling attempts for timeout
}

export default function BulkUploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Poll for processing files and trigger auto-analysis
  useEffect(() => {
    const processingFiles = files.filter(
      (f) =>
        (f.status === "processing" || f.status === "analyzing") &&
        f.transcriptId,
    );

    if (processingFiles.length === 0) return;

    const MAX_POLL_COUNT = 60; // 5 minutes at 5s intervals

    const pollInterval = setInterval(async () => {
      // Use Promise.all to parallelize status checks instead of sequential loop
      await Promise.all(
        processingFiles.map(async (uploadFile) => {
          const pollCount = uploadFile.pollCount || 0;

          // Check for timeout
          if (pollCount >= MAX_POLL_COUNT) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "error",
                      error: "Processing timeout after 5 minutes",
                    }
                  : f,
              ),
            );
            toast.error("Processing timeout", {
              description: `${uploadFile.file.name} - please try again`,
            });
            return;
          }

          // Increment poll count
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, pollCount: pollCount + 1 } : f,
            ),
          );

          try {
            const res = await fetch(
              `/api/transcripts/${uploadFile.transcriptId}`,
            );
            if (!res.ok) {
              let errorMessage = "Failed to check transcript status";
              try {
                const errorData = await res.json();
                errorMessage = errorData.error || errorMessage;
              } catch {
                // Ignore parse errors and use fallback message.
              }
              if (res.status === 401) {
                errorMessage = "Session expired. Please sign in again.";
              }
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: "error", error: errorMessage }
                    : f,
                ),
              );
              toast.error("Processing failed", {
                description: `${uploadFile.file.name} - ${errorMessage}`,
              });
              return;
            }

            const data = await res.json();

            if (data.status === "ready" && uploadFile.status === "processing") {
              // Transcription complete
              if (autoAnalyze) {
                // Auto-trigger analysis
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadFile.id
                      ? { ...f, status: "analyzing", progress: 75 }
                      : f,
                  ),
                );

                toast.success("Transcription complete", {
                  description: `Starting analysis for ${uploadFile.file.name}`,
                });

                // Trigger analysis
                try {
                  const analysisRes = await fetch("/api/calls", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      transcriptId: uploadFile.transcriptId,
                    }),
                  });

                  if (analysisRes.ok) {
                    const analysisData = await analysisRes.json();
                    setFiles((prev) =>
                      prev.map((f) =>
                        f.id === uploadFile.id
                          ? {
                              ...f,
                              status: "complete",
                              progress: 100,
                              callId: analysisData.id,
                            }
                          : f,
                      ),
                    );
                    toast.success("Analysis complete", {
                      description: `${uploadFile.file.name} is ready`,
                      action: {
                        label: "View",
                        onClick: () => router.push(`/calls/${analysisData.id}`),
                      },
                    });
                  } else {
                    let errorMessage = "Analysis failed";
                    try {
                      const errorData = await analysisRes.json();
                      errorMessage = errorData.error || errorMessage;
                    } catch {
                      // Ignore parse errors and use fallback message.
                    }
                    if (analysisRes.status === 401) {
                      errorMessage = "Session expired. Please sign in again.";
                    }
                    throw new Error(errorMessage);
                  }
                } catch (err) {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === uploadFile.id
                        ? {
                            ...f,
                            status: "ready",
                            progress: 100,
                            error:
                              err instanceof Error
                                ? err.message
                                : "Auto-analysis failed",
                          }
                        : f,
                    ),
                  );
                  toast.error("Auto-analysis failed", {
                    description:
                      err instanceof Error
                        ? `${uploadFile.file.name} - ${err.message}`
                        : `${uploadFile.file.name} - analysis can be started manually`,
                  });
                }
              } else {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadFile.id
                      ? { ...f, status: "ready", progress: 100 }
                      : f,
                  ),
                );
                toast.success("Transcription complete", {
                  description: uploadFile.file.name,
                });
              }
            } else if (data.status === "error") {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: "error", error: "Transcription failed" }
                    : f,
                ),
              );
              toast.error("Transcription failed", {
                description: uploadFile.file.name,
              });
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }),
      );
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [files, autoAnalyze, router]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    const fileArray = Array.from(newFiles).slice(0, 10); // Max 10 files
    const uploadFiles: UploadFile[] = fileArray.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      inputType: "audio",
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);

    // Start uploading files
    uploadFiles.forEach((fileToUpload) => uploadFile(fileToUpload));
  };

  const handleImports = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    const fileArray = Array.from(newFiles).slice(0, 10);
    const importFiles: UploadFile[] = fileArray.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      inputType: "import",
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...importFiles]);
    importFiles.forEach((fileToImport) => importFile(fileToImport));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, status: "uploading", progress: 10 }
          : f,
      ),
    );

    try {
      const formData = new FormData();
      formData.append("file", uploadFile.file);

      const res = await fetch("/api/transcripts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await res.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "processing",
                progress: 50,
                transcriptId: result.id,
              }
            : f,
        ),
      );

      toast.success("Upload successful", {
        description: `Transcribing ${uploadFile.file.name}...`,
      });

      router.refresh();
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: err.message || "Upload failed",
              }
            : f,
        ),
      );
      toast.error("Upload failed", {
        description: err.message || "Failed to upload file",
      });
    }
  };

  const importFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, status: "uploading", progress: 20 }
          : f,
      ),
    );

    try {
      const extension = uploadFile.file.name.toLowerCase().split(".").pop();
      const isJson = extension === "json";
      const isCsv = extension === "csv";
      const isMarkdown =
        extension === "md" || extension === "markdown" || extension === "txt";

      if (!isJson && !isCsv && !isMarkdown) {
        throw new Error("Unsupported import format. Use .json, .csv, or .md");
      }

      let res: Response;
      if (isJson) {
        const text = await uploadFile.file.text();
        const json = JSON.parse(text);
        res = await fetch("/api/transcripts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
      } else if (isCsv) {
        const csv = await uploadFile.file.text();
        res = await fetch("/api/transcripts/import", {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: csv,
        });
      } else {
        const markdown = await uploadFile.file.text();
        res = await fetch("/api/transcripts/import", {
          method: "POST",
          headers: { "Content-Type": "text/markdown" },
          body: markdown,
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const result = await res.json();
      const transcriptId: string = result.id;

      if (!autoAnalyze) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "ready", progress: 100, transcriptId }
              : f,
          ),
        );
        toast.success("Transcript imported", {
          description: `${uploadFile.file.name} is ready for analysis`,
        });
        router.refresh();
        return;
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "analyzing", progress: 70, transcriptId }
            : f,
        ),
      );
      toast.success("Call analysis ready", {
        description: "Markers are being extracted.",
      });

      const analysisRes = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptId }),
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json();
        throw new Error(data.error || "Analysis failed");
      }

      const analysisData = await analysisRes.json();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "complete",
                progress: 100,
                callId: analysisData.id,
              }
            : f,
        ),
      );
      toast.success("Import analysis started", {
        description: `${uploadFile.file.name} is processing markers`,
        action: {
          label: "View",
          onClick: () => router.push(`/calls/${analysisData.id}`),
        },
      });
      router.refresh();
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: err.message || "Import failed",
              }
            : f,
        ),
      );
      toast.error("Import failed", {
        description: err.message || "Failed to import transcript",
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ""; // Reset input
  };

  const handleImportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImports(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles((prev) =>
      prev.filter(
        (f) =>
          f.status !== "ready" &&
          f.status !== "complete" &&
          f.status !== "error",
      ),
    );
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "ready":
      case "complete":
        return (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="h-5 w-5 text-green-600"
          />
        );
      case "error":
        return (
          <HugeiconsIcon
            icon={CancelCircleIcon}
            className="h-5 w-5 text-destructive"
          />
        );
      case "uploading":
      case "processing":
      case "analyzing":
        return (
          <HugeiconsIcon
            icon={Loading03Icon}
            className="h-5 w-5 animate-spin text-primary"
          />
        );
      default:
        return (
          <HugeiconsIcon
            icon={MusicNote01Icon}
            className="h-5 w-5 text-muted-foreground"
          />
        );
    }
  };

  const getStatusText = (uploadFile: UploadFile) => {
    const sizeMB = (uploadFile.file.size / 1024 / 1024).toFixed(2);
    switch (uploadFile.status) {
      case "uploading":
        return `${sizeMB} MB • Uploading...`;
      case "processing":
        return `${sizeMB} MB • ${uploadFile.inputType === "audio" ? "Transcribing..." : "Importing..."}`;
      case "analyzing":
        return `${sizeMB} MB • Call analysis ready - Markers are being extracted`;
      case "ready":
        return `${sizeMB} MB • ${uploadFile.inputType === "audio" ? "Transcription Complete" : "Import Complete"}`;
      case "complete":
        return `${sizeMB} MB • Analysis Complete`;
      case "error":
        return `${sizeMB} MB • ${uploadFile.error}`;
      default:
        return `${sizeMB} MB`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-0">
        <div className="flex items-center gap-2 mb-4">
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Audio
          </Button>
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
          >
            Import Transcript
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.csv,.md,.markdown,.txt"
            multiple
            onChange={handleImportInput}
            className="hidden"
          />
        </div>

        {/* Auto-Analyze Toggle - Moved to header */}
        <div className="flex items-center gap-2.5">
          <Label
            htmlFor="auto-analyze"
            className="text-sm font-medium text-muted-foreground"
          >
            Auto-analyze
          </Label>
          <Switch
            id="auto-analyze"
            checked={autoAnalyze}
            onCheckedChange={setAutoAnalyze}
          />
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary hover:bg-accent/50"
        }`}
      >
        <HugeiconsIcon
          icon={Upload02Icon}
          className="mx-auto h-9 w-9 text-muted-foreground"
        />
        <h3 className="mt-2.5 text-base font-medium text-foreground">
          {isDragging ? "Drop files here" : "Drag and drop audio files"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse (up to 10 files, max 25MB each)
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Supported: MP3, WAV, M4A • For transcripts: JSON, CSV, or Markdown
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.m4a"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Upload Queue */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>
                  {files.length} file{files.length === 1 ? "" : "s"}
                </CardDescription>
              </div>
              {files.some(
                (f) =>
                  f.status === "ready" ||
                  f.status === "complete" ||
                  f.status === "error",
              ) && (
                <Button variant="outline" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 rounded-lg border p-3.5"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(uploadFile.status)}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(uploadFile)}
                  </p>

                  {/* Progress Bar */}
                  {(uploadFile.status === "uploading" ||
                    uploadFile.status === "processing" ||
                    uploadFile.status === "analyzing") && (
                    <Progress value={uploadFile.progress} className="mt-2" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {uploadFile.status === "complete" && uploadFile.callId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/calls/${uploadFile.callId}`)}
                    >
                      View
                    </Button>
                  ) : uploadFile.status === "ready" &&
                    uploadFile.transcriptId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/calls/new?transcriptId=${uploadFile.transcriptId}`,
                        )
                      }
                    >
                      Analyze
                    </Button>
                  ) : uploadFile.status === "pending" ||
                    uploadFile.status === "error" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
