import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getChainConfig } from "@/lib/chains";
import { eq, desc } from "drizzle-orm";
import { ChainStatusInfo } from "@/lib/chains/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const config = getChainConfig(chainId);

    if (!config) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Get chain status
    const status = await db.query.chainStatus.findFirst({
      where: eq(schema.chainStatus.chainId, chainId),
    });

    // Get recent block snapshots (last 100)
    const snapshots = await db.query.blockSnapshots.findMany({
      where: eq(schema.blockSnapshots.chainId, chainId),
      orderBy: desc(schema.blockSnapshots.recordedAt),
      limit: 100,
    });

    // Get recent halt events (last 20)
    const haltEvents = await db.query.haltEvents.findMany({
      where: eq(schema.haltEvents.chainId, chainId),
      orderBy: desc(schema.haltEvents.startedAt),
      limit: 20,
    });

    const now = Math.floor(Date.now() / 1000);

    const chainStatus: ChainStatusInfo = {
      chainId: config.id,
      name: config.name,
      status: (status?.status as ChainStatusInfo["status"]) || "unknown",
      latestBlockNumber: status?.latestBlockNumber ?? null,
      latestBlockTimestamp: status?.latestBlockTimestamp ?? null,
      timeSinceLastBlock: status?.latestBlockTimestamp
        ? now - status.latestBlockTimestamp
        : null,
      primarySourceStatus: (status?.primarySourceStatus as "up" | "down") || "down",
      secondarySourceStatus: (status?.secondarySourceStatus as "up" | "down") || "down",
      tertiarySourceStatus: (status?.tertiarySourceStatus as "up" | "down") || "down",
      primarySourceName: status?.primarySourceName ?? undefined,
      secondarySourceName: status?.secondarySourceName ?? undefined,
      tertiarySourceName: status?.tertiarySourceName ?? undefined,
      uptimePercent24h: status?.uptimePercent24h ?? null,
      uptimePercent7d: status?.uptimePercent7d ?? null,
      uptimePercent30d: status?.uptimePercent30d ?? null,
      lastCheckedAt: status?.lastCheckedAt ?? null,
      expectedBlockTime: config.expectedBlockTime,
      haltThreshold: config.haltThreshold,
    };

    return NextResponse.json({
      chain: chainStatus,
      snapshots: snapshots.map((s) => ({
        blockNumber: s.blockNumber,
        blockTimestamp: s.blockTimestamp,
        source: s.source,
        recordedAt: s.recordedAt.toISOString(),
      })),
      haltEvents: haltEvents.map((e) => ({
        id: e.id,
        startedAt: e.startedAt.toISOString(),
        endedAt: e.endedAt?.toISOString() ?? null,
        durationSeconds: e.durationSeconds,
        severity: e.severity,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching chain:", error);
    return NextResponse.json(
      { error: "Failed to fetch chain details" },
      { status: 500 }
    );
  }
}
