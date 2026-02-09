"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QualityFlag } from "../lib/types/audio-intelligence";

interface AudioQualityBadgeProps {
  qualityScore: number;
  flags?: QualityFlag[];
}

/**
 * Audio quality badge with color-coded score and tooltip
 * Green (>= 0.7), Yellow (0.4-0.7), Red (< 0.4)
 */
export default function AudioQualityBadge({
  qualityScore,
  flags = [],
}: AudioQualityBadgeProps) {
  // Determine badge variant and color based on quality score
  const getVariantAndClass = () => {
    if (qualityScore >= 0.7) {
      return { variant: "secondary" as const, className: "bg-green-100 text-green-800 border-green-200" };
    } else if (qualityScore >= 0.4) {
      return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else {
      return { variant: "secondary" as const, className: "bg-red-100 text-red-800 border-red-200" };
    }
  };

  const { variant, className } = getVariantAndClass();

  // Format quality flag for display
  const formatFlag = (flag: QualityFlag): string => {
    const flagLabels: Record<QualityFlag, string> = {
      low_confidence: "Low confidence",
      high_noise: "High noise",
      poor_compression: "Poor compression",
      short_duration: "Short duration",
      low_sample_rate: "Low sample rate",
    };
    return flagLabels[flag] || flag;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={className}>
            Quality: {Math.round(qualityScore * 100)}%
          </Badge>
        </TooltipTrigger>
        {flags.length > 0 && (
          <TooltipContent>
            <div className="text-xs">
              <div className="font-semibold mb-1">Quality Issues:</div>
              <ul className="space-y-0.5">
                {flags.map((flag, idx) => (
                  <li key={idx}>• {formatFlag(flag)}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
