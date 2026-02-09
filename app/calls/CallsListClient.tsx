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
    qualityScore: number | null;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
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
type StatusFilter = "all" | "complete" | "processing" | "error";
type SortBy = "date-desc" | "date-asc" | "duration-desc" | "signals-desc";

export default function CallsListClient({ calls, stats }: CallsListClientProps) {
  const [filteredCalls, setFilteredCalls] = useState<Call[]>(calls);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = () => {
    // Build query params
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.append("outcome", activeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    // Trigger download
    window.location.href = `/api/calls/export?${params.toString()}`;
  };

  useEffect(() => {
    // Apply all filters and sorting
    let filtered = calls;

    // Filter by outcome
    if (activeFilter !== "all") {
      filtered = filtered.filter((call) => call.outcome === activeFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((call) => call.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((call) =>
        call.transcript.filename.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((call) => new Date(call.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((call) => new Date(call.createdAt) <= end);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "duration-desc":
          return (b.transcript.durationSeconds || 0) - (a.transcript.durationSeconds || 0);
        case "signals-desc":
          return b._count.signals - a._count.signals;
        default:
          return 0;
      }
    });

    setFilteredCalls(filtered);
  }, [calls, activeFilter, statusFilter, searchQuery, sortBy, startDate, endDate]);

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border bg-white p-4">
          <div className="text-2xl font-bold text-foreground">
            {stats.total}
          </div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>
        <div className="rounded-xl border border bg-white p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.success}
          </div>
          <div className="text-sm text-muted-foreground">Successful</div>
        </div>
        <div className="rounded-xl border border bg-white p-4">
          <div className="text-2xl font-bold text-red-600">
            {stats.failure}
          </div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 rounded-xl border border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Search
            </label>
            <input
              type="search"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border bg-white px-3 py-2 text-sm text-foreground placeholder-[#999] focus:border-[#ff6b35] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border bg-white px-3 py-2 text-sm text-foreground focus:border-[#ff6b35] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="complete">Complete</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full rounded-lg border border bg-white px-3 py-2 text-sm text-foreground focus:border-[#ff6b35] focus:outline-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="duration-desc">Longest First</option>
              <option value="signals-desc">Most Signals</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border bg-white px-2 py-2 text-xs text-foreground focus:border-[#ff6b35] focus:outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border bg-white px-2 py-2 text-xs text-foreground focus:border-[#ff6b35] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || statusFilter !== "all" || startDate || endDate) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Active filters:
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground hover:bg-[#e5e5e5]"
              >
                Search: "{searchQuery}"
                <span className="text-muted-foreground">×</span>
              </button>
            )}
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground hover:bg-[#e5e5e5]"
              >
                Status: {statusFilter}
                <span className="text-muted-foreground">×</span>
              </button>
            )}
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-xs text-foreground hover:bg-[#e5e5e5]"
              >
                Date: {startDate || "..."} to {endDate || "..."}
                <span className="text-muted-foreground">×</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === "all"
              ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setActiveFilter("success")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === "success"
              ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Success ({stats.success})
        </button>
        <button
          onClick={() => setActiveFilter("failure")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeFilter === "failure"
              ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Failure ({stats.failure})
        </button>
      </div>

      {/* Results Count & Export */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCalls.length} of {calls.length} calls
        </div>
        {filteredCalls.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f5f5f5]"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <div className="rounded-2xl border border bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
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
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No calls yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
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
