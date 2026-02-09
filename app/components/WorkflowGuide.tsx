"use client";

import Link from "next/link";
import { useState } from "react";

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface WorkflowGuideProps {
  transcriptsCount: number;
  callsCount: number;
  playbooksCount: number;
}

export default function WorkflowGuide({
  transcriptsCount,
  callsCount,
  playbooksCount,
}: WorkflowGuideProps) {
  const [collapsed, setCollapsed] = useState(false);

  const steps: WorkflowStep[] = [
    {
      number: 1,
      title: "Upload Audio",
      description: "Upload your call recordings to get transcripts",
      href: "/transcripts",
      completed: transcriptsCount > 0,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      ),
    },
    {
      number: 2,
      title: "Analyze Calls",
      description: "Extract behavioral signals from transcripts",
      href: "/calls/new",
      completed: callsCount > 0,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      number: 3,
      title: "Compare Outcomes",
      description: "See what differentiates success from failure",
      href: "/compare",
      completed: callsCount >= 2,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      number: 4,
      title: "Generate Playbook",
      description: "Create AI-powered behavioral guidance",
      href: "/compare",
      completed: playbooksCount > 0,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border border-[#e5e5e5] bg-white px-4 py-3 shadow-lg transition-all hover:shadow-xl dark:border-[#2a2a2a] dark:bg-[#0a0a0a]"
      >
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-[#f5f5f5] dark:text-[#1a1a1a]"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPercentage / 100)}`}
              className="text-[#ff6b35] transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1a1a1a] dark:text-white">
            {completedCount}/{steps.length}
          </div>
        </div>
        <span className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#ff6b35] dark:text-white dark:group-hover:text-[#ff6b35]">
          Getting Started Guide
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-[#e5e5e5] bg-white shadow-xl dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] p-4 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a1a1a] dark:text-white">
            Getting Started
          </h3>
          <button
            onClick={() => setCollapsed(true)}
            className="text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[#666] dark:text-[#999]">
            <span>{completedCount} of {steps.length} completed</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[#f5f5f5] dark:bg-[#1a1a1a]">
            <div
              className="h-2 rounded-full bg-[#ff6b35] transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {steps.map((step) => (
          <Link
            key={step.number}
            href={step.href}
            className={`block rounded-lg border p-3 transition-all ${
              step.completed
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-[#e5e5e5] hover:border-[#ff6b35] dark:border-[#2a2a2a] dark:hover:border-[#ff6b35]"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  step.completed
                    ? "bg-green-600 text-white"
                    : "bg-[#f5f5f5] text-[#666] dark:bg-[#1a1a1a] dark:text-[#999]"
                }`}
              >
                {step.completed ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {step.icon}
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#999]">
                    Step {step.number}
                  </span>
                  {step.completed && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✓ Complete
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-[#1a1a1a] dark:text-white">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-[#666] dark:text-[#999]">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {!step.completed && (
                <svg
                  className="h-5 w-5 flex-shrink-0 text-[#999]"
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
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      {completedCount === steps.length && (
        <div className="border-t border-[#e5e5e5] p-4 dark:border-[#2a2a2a]">
          <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🎉 You're all set up!
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-300">
              Explore the analytics dashboard for insights
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
