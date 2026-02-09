"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const actions = [
    {
      name: "Upload Audio",
      description: "Upload new call recordings",
      href: "/transcripts",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      ),
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "Analyze Call",
      description: "Create new call analysis",
      href: "/calls/new",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
      color: "text-green-600 dark:text-green-400",
    },
    {
      name: "Compare Outcomes",
      description: "View success vs failure patterns",
      href: "/compare",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      name: "View Analytics",
      description: "See trends and insights",
      href: "/analytics",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] transition-all hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#2a2a2a]"
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="hidden sm:inline">Quick Actions</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#e5e5e5] bg-white shadow-lg dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="p-2">
            {actions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]"
              >
                <div className={`flex-shrink-0 ${action.color}`}>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {action.icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                    {action.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#666] dark:text-[#999]">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e5e5e5] p-2 dark:border-[#2a2a2a]">
            <div className="rounded-lg bg-[#f5f5f5] p-3 dark:bg-[#1a1a1a]">
              <p className="text-xs text-[#666] dark:text-[#999]">
                💡 <strong>Tip:</strong> Use keyboard shortcuts for faster navigation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
