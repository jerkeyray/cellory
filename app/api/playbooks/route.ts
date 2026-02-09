import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { compareOutcomes, generateSuccessInsights } from "@/app/lib/comparator";
import { generatePlaybook, generateSuccessPlaybook } from "@/app/lib/playbook-generator";
import { AggregateFeaturesV3 } from "@/app/lib/aggregator-v3";

/**
 * Generate and save a new playbook
 * POST /api/playbooks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mode } = await request.json();

    // Fetch all complete calls with aggregates
    const successCalls = await prisma.call.findMany({
      where: {
        userId: session.user.id,
        outcome: "success",
        status: "complete",
        aggregates: { some: {} },
      },
      select: {
        aggregates: {
          select: { features: true },
          take: 1,
        },
      },
    });

    const failureCalls = await prisma.call.findMany({
      where: {
        userId: session.user.id,
        outcome: "failure",
        status: "complete",
        aggregates: { some: {} },
      },
      select: {
        aggregates: {
          select: { features: true },
          take: 1,
        },
      },
    });

    const successAggregates = successCalls.map(
      (call) => call.aggregates[0].features as unknown as AggregateFeaturesV3
    );

    const failureAggregates = failureCalls.map(
      (call) => call.aggregates[0].features as unknown as AggregateFeaturesV3
    );

    let playbookResult;

    // Check if we have both success and failure data
    if (successAggregates.length > 0 && failureAggregates.length > 0) {
      // Comparative playbook
      const comparison = compareOutcomes(successAggregates, failureAggregates);
      playbookResult = await generatePlaybook(comparison as any);
    } else if (successAggregates.length > 0) {
      // Success-only playbook
      const insights = generateSuccessInsights(successAggregates);
      playbookResult = await generateSuccessPlaybook(insights);
    } else {
      return NextResponse.json(
        { error: "Need at least 1 successful call to generate a playbook" },
        { status: 400 }
      );
    }

    // Save playbook to database
    const playbook = await prisma.playbook.create({
      data: {
        userId: session.user.id,
        title: playbookResult.title,
        content: playbookResult.content,
        callCount: playbookResult.callCount,
        confidenceScores: playbookResult.confidenceScores,
      },
    });

    return NextResponse.json(playbook);
  } catch (error) {
    console.error("Error generating playbook:", error);
    return NextResponse.json(
      { error: "Failed to generate playbook" },
      { status: 500 }
    );
  }
}

/**
 * Get all playbooks
 * GET /api/playbooks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const playbooks = await prisma.playbook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.playbook.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      playbooks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching playbooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbooks" },
      { status: 500 }
    );
  }
}
