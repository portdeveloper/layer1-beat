import { getAllAdapters, getChainConfig, CHAIN_CONFIGS } from "../chains";
import { PollResult, ChainStatusType, BlockData } from "../chains/types";
import { crossValidateResults, calculateUptimePercent } from "./halt-detector";
import { db, schema } from "../db";
import { eq, and, gte, isNull, desc } from "drizzle-orm";

/**
 * Polls all chains in parallel and returns results
 */
export async function pollAllChains(): Promise<PollResult[]> {
  const adapters = getAllAdapters();

  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      // Fetch all three sources in parallel
      const [primary, secondary, tertiary] = await Promise.all([
        adapter.fetchPrimary(),
        adapter.fetchSecondary(),
        adapter.fetchTertiary(),
      ]);

      const detection = crossValidateResults(adapter.chainId, primary, secondary, tertiary);

      return {
        chainId: adapter.chainId,
        primary,
        secondary,
        tertiary,
        determinedStatus: detection.status,
        blockData: detection.blockData,
      };
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<PollResult> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}

/**
 * Initializes the database with chain configurations if not already present
 */
export async function initializeChains(): Promise<void> {
  for (const config of CHAIN_CONFIGS) {
    const existing = await db.query.chains.findFirst({
      where: eq(schema.chains.id, config.id),
    });

    if (!existing) {
      await db.insert(schema.chains).values({
        id: config.id,
        name: config.name,
        expectedBlockTime: config.expectedBlockTime,
        haltThreshold: config.haltThreshold,
      });

      // Initialize status record
      await db.insert(schema.chainStatus).values({
        chainId: config.id,
        status: "unknown",
      });
    }
  }
}

/**
 * Updates database with poll results
 */
export async function updateDatabaseWithResults(
  results: PollResult[]
): Promise<void> {
  const now = new Date();

  for (const result of results) {
    const config = getChainConfig(result.chainId);
    if (!config) continue;

    // Record block snapshots if we have valid data
    // Record primary source snapshot
    if (
      result.primary.success &&
      result.primary.data &&
      typeof result.primary.data.blockNumber === "number" &&
      !isNaN(result.primary.data.blockNumber) &&
      typeof result.primary.data.blockTimestamp === "number" &&
      !isNaN(result.primary.data.blockTimestamp)
    ) {
      await db.insert(schema.blockSnapshots).values({
        chainId: result.chainId,
        blockNumber: result.primary.data.blockNumber,
        blockTimestamp: result.primary.data.blockTimestamp,
        source: "primary",
        recordedAt: now,
      });
    }

    // Record secondary source snapshot
    if (
      result.secondary.success &&
      result.secondary.data &&
      typeof result.secondary.data.blockNumber === "number" &&
      !isNaN(result.secondary.data.blockNumber) &&
      typeof result.secondary.data.blockTimestamp === "number" &&
      !isNaN(result.secondary.data.blockTimestamp)
    ) {
      await db.insert(schema.blockSnapshots).values({
        chainId: result.chainId,
        blockNumber: result.secondary.data.blockNumber,
        blockTimestamp: result.secondary.data.blockTimestamp,
        source: "secondary",
        recordedAt: now,
      });
    }

    // Record tertiary source snapshot
    if (
      result.tertiary.success &&
      result.tertiary.data &&
      typeof result.tertiary.data.blockNumber === "number" &&
      !isNaN(result.tertiary.data.blockNumber) &&
      typeof result.tertiary.data.blockTimestamp === "number" &&
      !isNaN(result.tertiary.data.blockTimestamp)
    ) {
      await db.insert(schema.blockSnapshots).values({
        chainId: result.chainId,
        blockNumber: result.tertiary.data.blockNumber,
        blockTimestamp: result.tertiary.data.blockTimestamp,
        source: "tertiary",
        recordedAt: now,
      });
    }

    // Handle halt events
    await handleHaltEvents(result, now);

    // Calculate uptime percentages
    const uptime24h = await calculateUptimeForPeriod(result.chainId, 24 * 60 * 60);
    const uptime7d = await calculateUptimeForPeriod(result.chainId, 7 * 24 * 60 * 60);
    const uptime30d = await calculateUptimeForPeriod(result.chainId, 30 * 24 * 60 * 60);

    // Update or insert chain status (upsert)
    await db
      .insert(schema.chainStatus)
      .values({
        chainId: result.chainId,
        status: result.determinedStatus,
        latestBlockNumber: result.blockData?.blockNumber ?? null,
        latestBlockTimestamp: result.blockData?.blockTimestamp ?? null,
        primarySourceStatus: result.primary.success ? "up" : "down",
        secondarySourceStatus: result.secondary.success ? "up" : "down",
        tertiarySourceStatus: result.tertiary.success ? "up" : "down",
        uptimePercent24h: uptime24h,
        uptimePercent7d: uptime7d,
        uptimePercent30d: uptime30d,
        lastCheckedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.chainStatus.chainId,
        set: {
          status: result.determinedStatus,
          latestBlockNumber: result.blockData?.blockNumber ?? null,
          latestBlockTimestamp: result.blockData?.blockTimestamp ?? null,
          primarySourceStatus: result.primary.success ? "up" : "down",
          secondarySourceStatus: result.secondary.success ? "up" : "down",
          tertiarySourceStatus: result.tertiary.success ? "up" : "down",
          uptimePercent24h: uptime24h,
          uptimePercent7d: uptime7d,
          uptimePercent30d: uptime30d,
          lastCheckedAt: now,
          updatedAt: now,
        },
      });
  }
}

/**
 * Handles creation and closing of halt events based on status changes
 */
async function handleHaltEvents(result: PollResult, now: Date): Promise<void> {
  // Find any open halt event for this chain
  const openEvent = await db.query.haltEvents.findFirst({
    where: and(
      eq(schema.haltEvents.chainId, result.chainId),
      isNull(schema.haltEvents.endedAt)
    ),
    orderBy: desc(schema.haltEvents.startedAt),
  });

  // Only count "halted" as downtime, not "slow"
  // Slow means blocks are delayed but still producing (normal variation)
  // Halted means no blocks for an extended period (actual downtime)
  const isUnhealthy = result.determinedStatus === "halted";

  if (isUnhealthy && !openEvent) {
    // Create new halt event
    await db.insert(schema.haltEvents).values({
      chainId: result.chainId,
      startedAt: now,
      severity: result.determinedStatus as "slow" | "halted",
    });
  } else if (!isUnhealthy && openEvent) {
    // Close the halt event
    const durationSeconds = Math.floor(
      (now.getTime() - openEvent.startedAt.getTime()) / 1000
    );
    await db
      .update(schema.haltEvents)
      .set({
        endedAt: now,
        durationSeconds,
      })
      .where(eq(schema.haltEvents.id, openEvent.id));
  } else if (isUnhealthy && openEvent) {
    // Update severity if it changed
    if (openEvent.severity !== result.determinedStatus) {
      await db
        .update(schema.haltEvents)
        .set({
          severity: result.determinedStatus as "slow" | "halted",
        })
        .where(eq(schema.haltEvents.id, openEvent.id));
    }
  }
}

/**
 * Calculates uptime percentage for a given time period
 */
async function calculateUptimeForPeriod(
  chainId: string,
  periodSeconds: number
): Promise<number> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodSeconds * 1000);

  // Get all halt events that overlap with this period
  const haltEvents = await db.query.haltEvents.findMany({
    where: and(
      eq(schema.haltEvents.chainId, chainId),
      gte(schema.haltEvents.startedAt, periodStart)
    ),
  });

  // Also check for events that started before the period but haven't ended
  const ongoingEvents = await db.query.haltEvents.findMany({
    where: and(
      eq(schema.haltEvents.chainId, chainId),
      isNull(schema.haltEvents.endedAt)
    ),
  });

  let totalDowntimeSeconds = 0;

  for (const event of [...haltEvents, ...ongoingEvents]) {
    const eventStart = Math.max(event.startedAt.getTime(), periodStart.getTime());
    const eventEnd = event.endedAt
      ? Math.min(event.endedAt.getTime(), now.getTime())
      : now.getTime();

    if (eventEnd > eventStart) {
      totalDowntimeSeconds += (eventEnd - eventStart) / 1000;
    }
  }

  return calculateUptimePercent(periodSeconds, totalDowntimeSeconds);
}

/**
 * Main polling function that initializes and updates everything
 */
export async function runPollingCycle(): Promise<{
  success: boolean;
  results: PollResult[];
  error?: string;
}> {
  try {
    // Ensure chains are initialized
    await initializeChains();

    // Poll all chains
    const results = await pollAllChains();

    // Update database
    await updateDatabaseWithResults(results);

    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
