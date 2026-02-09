"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CallListItem from "./CallListItem";

interface Call {
  id: string;
  outcome: "success" | "failure";
  status: string;
  createdAt: Date;
  transcript: {
    filename: string;
    durationSeconds: number | null;
  };
  _count: {
    signals: number;
  };
}

interface CallsListClientProps {
  calls: Call[];
  stats: {
    total: number;
    success: number;
    failure: number;
  };
}

type FilterTab = "all" | "success" | "failure";

export default function CallsListClient({ calls, stats }: CallsListClientProps) {
  const [filteredCalls, setFilteredCalls] = useState<Call[]>(calls);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  useEffect(() => {
    // Filter calls based on active tab
    if (activeFilter === "all") {
      setFilteredCalls(calls);
    } else {
      setFilteredCalls(calls.filter((call) => call.outcome === activeFilter));
    }
  }, [calls, activeFilter]);

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="text-2xl font-bold text-[#1a1a1a] dark:text-white">
            {stats.total}
          </div>
          <div className="text-sm text-[#666] dark:text-[#999]">Total Calls</div>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.success}
          </div>
          <div className="text-sm text-[#666] dark:text-[#999]">Successful</div>
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
            <CallListItem key={call.id} call={call} />
          ))}
        </div>
      )}
    </>
  );
}
