"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqItems = [
  {
    q: "What types of calls work best with Cellory?",
    a: "Cellory is optimized for financial collections, sales, and customer service calls where behavioral patterns and outcomes matter. The platform excels at identifying what separates successful calls from unsuccessful ones, making it ideal for teams that need data-driven coaching.",
  },
  {
    q: "How long does it take to analyze a call?",
    a: "Transcription takes approximately 1-2 minutes for a typical 5-minute call. Signal extraction and aggregation adds another 30-60 seconds. Batch analysis processes multiple calls in parallel, so analyzing 20 calls takes roughly the same time as analyzing one.",
  },
  {
    q: "Is my call data secure?",
    a: "Yes. All audio files and transcripts are stored in encrypted Neon Postgres databases. We use Auth.js for authentication and never share your data with third parties. Your recordings and insights are only accessible to your authenticated account.",
  },
  {
    q: "How many calls do I need to generate a playbook?",
    a: "We recommend at least 10-15 calls with labeled outcomes (success/failure) for meaningful insights. The more calls you analyze, the more accurate your playbooks become. Our comparison engine works best with at least 5 successful and 5 unsuccessful calls.",
  },
  {
    q: "Can I customize the behavioral signals Cellory extracts?",
    a: "Currently, Cellory uses a predefined signal taxonomy optimized for financial conversations (objections, escalations, agreements, resolutions, etc.). Custom signal types are on our roadmap. You can, however, label outcomes and filter analysis by any criteria.",
  },
  {
    q: "Which audio formats are supported?",
    a: "We support MP3, WAV, M4A, and FLAC files up to 500MB each. Our pipeline automatically handles format conversion and quality assessment. Lower quality recordings (< 40% quality score) will still be processed but may have reduced signal accuracy.",
  },
  {
    q: "What makes Cellory different from other call analytics tools?",
    a: "Cellory is built specifically for outcome-driven coaching. Instead of generic sentiment analysis or keyword spotting, we extract behavioral signals, compare success vs. failure patterns, and generate actionable playbooks. Our deterministic aggregation pipeline means results are reproducible and auditable.",
  },
  {
    q: "Do I need technical knowledge to use Cellory?",
    a: "No. The interface is designed for sales managers, QA analysts, and team leads—not developers. Upload recordings, label outcomes (success/failure), and generate playbooks. The pipeline handles all the AI and data processing automatically.",
  },
];

export function LandingFaq() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="w-full space-y-3">
      {faqItems.map((item, i) => (
        <div
          key={i}
          className="group rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300 hover:shadow-sm"
        >
          <button
            onClick={() =>
              setOpenItem(openItem === i.toString() ? null : i.toString())
            }
            className="flex w-full items-start justify-between gap-4 p-5 text-left transition-all"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 group-hover:bg-stone-200 transition-colors">
                  <HelpCircle className="h-3.5 w-3.5 text-stone-600" />
                </div>
              </div>
              <span className="font-medium text-foreground leading-snug">
                {item.q}
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5 ${
                openItem === i.toString() ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openItem === i.toString()
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-5 pl-14">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
