"use client";

import { NLUResults } from "../lib/types/audio-intelligence";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface NLUInsightsCardProps {
  nluResults: NLUResults;
}

/**
 * NLU insights sidebar card for call detail page
 * Shows intents, obligations, regulatory compliance, and entities
 */
export default function NLUInsightsCard({ nluResults }: NLUInsightsCardProps) {
  const formatIntent = (intent: string) => {
    return intent.replace(/_/g, " ");
  };

  const formatObligationType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const formatRegulationType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const formatEntityType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  // Expected regulatory phrases for collections calls
  const expectedRegTypes = [
    "mini_miranda",
    "fdcpa_disclosure",
    "recording_notice",
  ];

  const regulatoryChecklist = expectedRegTypes.map((type) => {
    const phrase = nluResults.regulatory_phrases.find(
      (p) => p.regulation_type === type
    );
    return {
      type,
      present: phrase?.present || false,
    };
  });

  return (
    <div className="rounded-xl border border bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        NLU Insights
      </h3>

      <div className="space-y-4 text-sm">
        {/* Intents */}
        {nluResults.intents.length > 0 && (
          <div>
            <dt className="mb-2 text-xs font-medium text-muted-foreground">
              Intents ({nluResults.intents.length})
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {nluResults.intents.map((intent, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {formatIntent(intent.intent)}
                </Badge>
              ))}
            </dd>
          </div>
        )}

        {/* Obligations */}
        {nluResults.obligations.length > 0 && (
          <div>
            <dt className="mb-2 text-xs font-medium text-muted-foreground">
              Obligations ({nluResults.obligations.length})
            </dt>
            <dd className="space-y-2">
              {nluResults.obligations.slice(0, 5).map((obligation, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">
                        {formatObligationType(obligation.obligation_type)}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {obligation.obligor}
                        {obligation.deadline && (
                          <>
                            {" • "}
                            <span className="font-medium text-orange-600">
                              {obligation.deadline}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {nluResults.obligations.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{nluResults.obligations.length - 5} more
                </div>
              )}
            </dd>
          </div>
        )}

        {/* Regulatory Compliance */}
        <div>
          <dt className="mb-2 text-xs font-medium text-muted-foreground">
            Regulatory Compliance
          </dt>
          <dd className="space-y-1.5">
            {regulatoryChecklist.map((item) => (
              <div
                key={item.type}
                className="flex items-center gap-2 text-xs"
              >
                {item.present ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
                <span className={item.present ? "text-foreground" : "text-muted-foreground"}>
                  {formatRegulationType(item.type)}
                </span>
              </div>
            ))}
          </dd>
        </div>

        {/* Entities */}
        {nluResults.entities.length > 0 && (
          <div>
            <dt className="mb-2 text-xs font-medium text-muted-foreground">
              Entities ({nluResults.entities.length})
            </dt>
            <dd className="space-y-1">
              {nluResults.entities.slice(0, 5).map((entity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-muted-foreground">
                    {formatEntityType(entity.entity_type)}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {entity.value}
                  </span>
                </div>
              ))}
              {nluResults.entities.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{nluResults.entities.length - 5} more
                </div>
              )}
            </dd>
          </div>
        )}

        {/* Empty state */}
        {nluResults.intents.length === 0 &&
          nluResults.obligations.length === 0 &&
          nluResults.regulatory_phrases.length === 0 &&
          nluResults.entities.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              No NLU insights available
            </div>
          )}
      </div>
    </div>
  );
}
