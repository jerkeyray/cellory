import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Export calls to CSV
 * GET /api/calls/export?outcome=all&status=all&startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const outcome = searchParams.get("outcome");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = { userId: session.user.id };

    if (outcome && outcome !== "all") {
      where.outcome = outcome;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    // Fetch calls with aggregates
    const calls = await prisma.call.findMany({
      where,
      include: {
        transcript: {
          select: {
            filename: true,
            durationSeconds: true,
          },
        },
        signals: true,
        aggregates: {
          select: { features: true },
          take: 1,
        },
        tags: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const csvRows: string[] = [];

    // Header
    csvRows.push(
      [
        "ID",
        "Filename",
        "Outcome",
        "Status",
        "Created At",
        "Duration (seconds)",
        "Signals Count",
        "Constraints",
        "Resolution Latency (s)",
        "Control Recoveries",
        "Commitments",
        "Tags",
      ].join(",")
    );

    // Data rows
    for (const call of calls) {
      const agg = call.aggregates[0]?.features as any;
      const tags = call.tags.map((t) => t.name).join("; ");

      csvRows.push(
        [
          call.id,
          `"${call.transcript.filename.replace(/"/g, '""')}"`,
          call.outcome,
          call.status,
          new Date(call.createdAt).toISOString(),
          call.transcript.durationSeconds || "",
          call.signals.length,
          agg?.constraints_per_call || "",
          agg?.avg_resolution_latency || "",
          agg?.control_recoveries || "",
          agg?.commitment_count || "",
          `"${tags.replace(/"/g, '""')}"`,
        ].join(",")
      );
    }

    const csv = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="calls-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting calls:", error);
    return NextResponse.json(
      { error: "Failed to export calls" },
      { status: 500 }
    );
  }
}
