import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getChainConfig, CHAIN_CONFIGS } from "@/lib/chains";
import { ChainStatusInfo } from "@/lib/chains/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all chain statuses from database
    const statuses = await db.query.chainStatus.findMany();

    const now = Math.floor(Date.now() / 1000);

    // Map to ChainStatusInfo format
    const chains: ChainStatusInfo[] = CHAIN_CONFIGS.map((config) => {
      const status = statuses.find((s) => s.chainId === config.id);

      return {
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
        uptimePercent24h: status?.uptimePercent24h ?? null,
        uptimePercent7d: status?.uptimePercent7d ?? null,
        uptimePercent30d: status?.uptimePercent30d ?? null,
        lastCheckedAt: status?.lastCheckedAt ?? null,
        expectedBlockTime: config.expectedBlockTime,
        haltThreshold: config.haltThreshold,
      };
    });

    return NextResponse.json({ chains, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Error fetching chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch chain statuses" },
      { status: 500 }
    );
  }
}
