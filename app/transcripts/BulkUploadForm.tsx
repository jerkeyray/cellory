"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "ready" | "error";
  progress: number;
  transcriptId?: string;
  error?: string;
}

export default function BulkUploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Poll for processing files
  useEffect(() => {
    const processingFiles = files.filter(
      (f) => f.status === "processing" && f.transcriptId
    );

    if (processingFiles.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const uploadFile of processingFiles) {
        try {
          const res = await fetch(`/api/transcripts/${uploadFile.transcriptId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "ready") {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: "ready", progress: 100 }
                    : f
                )
              );
            } else if (data.status === "error") {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: "error", error: "Transcription failed" }
                    : f
                )
              );
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [files]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    const fileArray = Array.from(newFiles).slice(0, 10); // Max 10 files
    const uploadFiles: UploadFile[] = fileArray.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);

    // Start uploading files
    uploadFiles.forEach((fileToUpload) => uploadFile(fileToUpload));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 10 } : f
      )
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
            : f
        )
      );

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
            : f
        )
      );
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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "ready" && f.status !== "error"));
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "ready":
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "uploading":
      case "processing":
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff6b35] border-t-transparent" />
        );
      default:
        return (
          <svg className="h-5 w-5 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
          isDragging
            ? "border-[#ff6b35] bg-[#fff5f2] dark:bg-[#1a0f0a]"
            : "border-[#e5e5e5] hover:border-[#ff6b35] dark:border-[#2a2a2a]"
        }`}
      >
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
        <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
          {isDragging ? "Drop files here" : "Upload Audio Files"}
        </h3>
        <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
          Drag and drop up to 10 audio files, or click to browse
        </p>
        <p className="mt-1 text-xs text-[#999]">
          Supported formats: MP3, WAV, M4A (max 25MB each)
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
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
              Upload Queue ({files.length})
            </h3>
            {files.some((f) => f.status === "ready" || f.status === "error") && (
              <button
                onClick={clearCompleted}
                className="text-sm text-[#666] hover:text-[#ff6b35] dark:text-[#999]"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 rounded-lg border border-[#e5e5e5] p-4 dark:border-[#2a2a2a]"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">{getStatusIcon(uploadFile.status)}</div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1a1a1a] dark:text-white">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-[#666] dark:text-[#999]">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    {uploadFile.status === "uploading" && " • Uploading..."}
                    {uploadFile.status === "processing" && " • Transcribing..."}
                    {uploadFile.status === "ready" && " • Complete"}
                    {uploadFile.status === "error" && ` • ${uploadFile.error}`}
                  </p>

                  {/* Progress Bar */}
                  {(uploadFile.status === "uploading" || uploadFile.status === "processing") && (
                    <div className="mt-2 h-1 w-full rounded-full bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                      <div
                        className="h-1 rounded-full bg-[#ff6b35] transition-all"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {uploadFile.status === "ready" && uploadFile.transcriptId ? (
                    <button
                      onClick={() => router.push(`/transcripts/${uploadFile.transcriptId}`)}
                      className="text-sm text-[#ff6b35] hover:underline"
                    >
                      View
                    </button>
                  ) : uploadFile.status === "pending" || uploadFile.status === "error" ? (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
