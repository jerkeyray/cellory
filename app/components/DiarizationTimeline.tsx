"use client";

import { DiarizationSegment } from "../lib/types/audio-intelligence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DiarizationTimelineProps {
  segments: DiarizationSegment[];
  totalDuration: number;
}

/**
 * Horizontal bar visualization of speaker diarization
 * Agent = blue, Customer = orange
 */
export default function DiarizationTimeline({
  segments,
  totalDuration,
}: DiarizationTimelineProps) {
  if (segments.length === 0 || totalDuration === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
          <span>Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-orange-500" />
          <span>Customer</span>
        </div>
      </div>

      <TooltipProvider>
        <div className="relative h-8 w-full rounded-lg border border bg-gray-50 overflow-hidden">
          {segments.map((segment, idx) => {
            const startPercent = (segment.start / totalDuration) * 100;
            const widthPercent =
              ((segment.end - segment.start) / totalDuration) * 100;
            const color = segment.speaker === "Agent" ? "bg-blue-500" : "bg-orange-500";

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute top-0 h-full ${color} hover:opacity-80 transition-opacity cursor-pointer`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-xs">
                    <div className="font-semibold mb-1">
                      {segment.speaker}
                    </div>
                    <div className="text-muted-foreground mb-1">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <div className="line-clamp-3">{segment.text}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
