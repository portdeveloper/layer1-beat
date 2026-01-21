import { NextRequest, NextResponse } from "next/server";
import { runPollingCycle } from "@/lib/monitor/poller";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for polling

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for external cron services
    const isDev = process.env.NODE_ENV === "development";
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runPollingCycle();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      polledChains: result.results.length,
      results: result.results.map((r) => ({
        chainId: r.chainId,
        status: r.determinedStatus,
        primaryUp: r.primary.success,
        secondaryUp: r.secondary.success,
        blockNumber: r.blockData?.blockNumber ?? null,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Polling error:", error);
    return NextResponse.json(
      { error: "Polling failed", success: false },
      { status: 500 }
    );
  }
}

// Also support GET for easier manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
