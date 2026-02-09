"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    q: "Can I export the playbooks?",
    a: "Yes, all playbooks can be exported as PDF or Markdown for easy sharing with your team. You can also integrate them directly into your LMS.",
  },
  {
    q: "Which audio formats are supported?",
    a: "We support MP3, WAV, M4A, and FLAC files up to 500MB each. Our pipeline automatically converts and optimizes audio for analysis.",
  },
];

export function LandingFaq() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqItems.map((item, i) => (
        <div key={i} className="border-b border-stone-200">
          <button
            onClick={() =>
              setOpenItem(openItem === i.toString() ? null : i.toString())
            }
            className="flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline"
          >
            {item.q}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                openItem === i.toString() ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden text-sm transition-all duration-300 ease-in-out ${
              openItem === i.toString()
                ? "max-h-40 opacity-100 mb-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="text-muted-foreground leading-relaxed">
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
