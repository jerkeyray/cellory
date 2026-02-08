"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Call {
  id: string;
  outcome: "success" | "failure";
  status: string;
  createdAt: string;
  transcript: {
    filename: string;
    durationSeconds: number | null;
  };
  _count: {
    signals: number;
  };
}

type FilterTab = "all" | "success" | "failure";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    // Filter calls based on active tab
    if (activeFilter === "all") {
      setFilteredCalls(calls);
    } else {
      setFilteredCalls(calls.filter((call) => call.outcome === activeFilter));
    }
  }, [calls, activeFilter]);

  const fetchCalls = async () => {
    try {
      const res = await fetch("/api/calls");
      if (!res.ok) throw new Error("Failed to fetch calls");
      const data = await res.json();
      setCalls(data);
    } catch (err) {
      setError("Failed to load calls");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      extracting:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      aggregating:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      complete:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
  };

  const getOutcomeBadge = (outcome: string) => {
    return outcome === "success" ? (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
        <span className="text-lg">✓</span> Success
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
        <span className="text-lg">✗</span> Failure
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    total: calls.length,
    success: calls.filter((c) => c.outcome === "success").length,
    failure: calls.filter((c) => c.outcome === "failure").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
              Call Analyses
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              Extract behavioral signals and patterns from calls
            </p>
          </div>

          <Link
            href="/calls/new"
            className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
          >
            New Analysis
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-2xl font-bold text-[#1a1a1a] dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-[#666] dark:text-[#999]">
              Total Calls
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.success}
            </div>
            <div className="text-sm text-[#666] dark:text-[#999]">
              Successful
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.failure}
            </div>
            <div className="text-sm text-[#666] dark:text-[#999]">Failed</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
                : "text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter("success")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === "success"
                ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
                : "text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white"
            }`}
          >
            Success ({stats.success})
          </button>
          <button
            onClick={() => setActiveFilter("failure")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === "failure"
                ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
                : "text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white"
            }`}
          >
            Failure ({stats.failure})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Calls List */}
        {filteredCalls.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-12 text-center dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-[#1a1a1a] dark:text-white">
              No calls yet
            </h3>
            <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
              {activeFilter === "all"
                ? "Start analyzing calls to see behavioral signals"
                : `No ${activeFilter} calls found`}
            </p>
            {activeFilter === "all" && (
              <Link
                href="/calls/new"
                className="mt-4 inline-block text-sm text-[#ff6b35] hover:underline"
              >
                Create your first analysis →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCalls.map((call) => (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className="group rounded-xl border border-[#e5e5e5] bg-white p-6 transition-all hover:border-[#ff6b35] hover:shadow-md dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:hover:border-[#ff6b35]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getOutcomeBadge(call.outcome)}
                      {getStatusBadge(call.status)}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a] dark:text-white">
                      {call.transcript.filename}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[#666] dark:text-[#999]">
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
                  </div>
                  <div className="text-right text-sm text-[#999]">
                    {formatDate(call.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
