/**
 * Outcome comparison API
 * GET — compare success vs failure calls
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { compareOutcomes } from "@/app/lib/comparator";
import { AggregateFeatures } from "@/app/lib/aggregator";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare calls" },
      { status: 500 }
    );
  }
}
