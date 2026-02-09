/**
 * Outcome comparison API
 * GET — compare success vs failure calls
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { compareOutcomes } from "@/app/lib/comparator";
import { AggregateFeatures } from "@/app/lib/aggregator";
import {
  getCachedComparison,
  setCachedComparison,
} from "@/app/lib/comparison-cache";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check cache first
  const cached = getCachedComparison(userId);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "X-Cache": "HIT",
      },
    });
  }

  try {
    // Get only aggregate features for successful calls
    const successCalls = await prisma.call.findMany({
      where: {
        outcome: "success",
        status: "complete",
        aggregates: { some: {} }, // Only calls with aggregates
      },
      select: {
        aggregates: {
          select: { features: true },
          take: 1,
        },
      },
    });

    // Get only aggregate features for failed calls
    const failureCalls = await prisma.call.findMany({
      where: {
        outcome: "failure",
        status: "complete",
        aggregates: { some: {} }, // Only calls with aggregates
      },
      select: {
        aggregates: {
          select: { features: true },
          take: 1,
        },
      },
    });

    // Extract features from the optimized query results
    const successAggregates: AggregateFeatures[] = successCalls.map(
      (call) => call.aggregates[0].features as unknown as AggregateFeatures
    );

    const failureAggregates: AggregateFeatures[] = failureCalls.map(
      (call) => call.aggregates[0].features as unknown as AggregateFeatures
    );

    // Run comparison
    const comparison = compareOutcomes(successAggregates, failureAggregates);

    // Cache the result
    setCachedComparison(userId, comparison);

    return NextResponse.json(comparison, {
      headers: {
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare calls" },
      { status: 500 }
    );
  }
}
