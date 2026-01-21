import {
  ChainStatusType,
  SourceResult,
  BlockData,
  PollResult,
} from "../chains/types";
import { getChainConfig } from "../chains";

export interface DetectionResult {
  status: ChainStatusType;
  blockData: BlockData | null;
  primaryUp: boolean;
  secondaryUp: boolean;
  tertiaryUp: boolean;
}

/**
 * Determines chain status based on time since last block
 */
export function determineStatusFromBlockTime(
  timeSinceLastBlock: number,
  expectedBlockTime: number
): ChainStatusType {
  // Healthy: time since last block < expectedBlockTime * 5
  if (timeSinceLastBlock < expectedBlockTime * 5) {
    return "healthy";
  }
  // Slow: time since last block < expectedBlockTime * 15
  if (timeSinceLastBlock < expectedBlockTime * 15) {
    return "slow";
  }
  // Halted: time since last block >= expectedBlockTime * 15
  return "halted";
}

/**
 * Cross-validates results from three sources and determines final status
 */
export function crossValidateResults(
  chainId: string,
  primary: SourceResult,
  secondary: SourceResult,
  tertiary: SourceResult
): DetectionResult {
  const config = getChainConfig(chainId);
  if (!config) {
    return {
      status: "unknown",
      blockData: null,
      primaryUp: false,
      secondaryUp: false,
      tertiaryUp: false,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const primaryUp = primary.success;
  const secondaryUp = secondary.success;
  const tertiaryUp = tertiary.success;

  const upCount = [primaryUp, secondaryUp, tertiaryUp].filter(Boolean).length;
  const sources = [
    { result: primary, up: primaryUp },
    { result: secondary, up: secondaryUp },
    { result: tertiary, up: tertiaryUp },
  ];

  // All three sources down -> stale
  if (upCount === 0) {
    return {
      status: "stale",
      blockData: null,
      primaryUp: false,
      secondaryUp: false,
      tertiaryUp: false,
    };
  }

  // Collect valid block data from all up sources
  const validBlocks = sources
    .filter((s) => s.up && s.result.data)
    .map((s) => s.result.data!);

  // Use the most recent block data (highest block number)
  const mostRecentBlock = validBlocks.reduce((best, current) =>
    current.blockNumber > best.blockNumber ? current : best
  );

  // Calculate status from each available source
  const statuses = sources
    .filter((s) => s.up && s.result.data)
    .map((s) => {
      const timeSinceLastBlock = now - s.result.data!.blockTimestamp;
      return determineStatusFromBlockTime(
        timeSinceLastBlock,
        config.expectedBlockTime
      );
    });

  // Only 1 source up -> degraded or worse
  if (upCount === 1) {
    const status = statuses[0];
    return {
      status: status === "healthy" ? "degraded" : status,
      blockData: mostRecentBlock,
      primaryUp,
      secondaryUp,
      tertiaryUp,
    };
  }

  // 2 sources up -> check consensus
  if (upCount === 2) {
    const [status1, status2] = statuses;

    // If both agree
    if (status1 === status2) {
      // Mark as degraded if healthy (since we're missing one source)
      const finalStatus = status1 === "healthy" ? "degraded" : status1;
      return {
        status: finalStatus,
        blockData: mostRecentBlock,
        primaryUp,
        secondaryUp,
        tertiaryUp,
      };
    }

    // Sources disagree - trust the source with most recent data
    // If one source has stale data, it might incorrectly report "halted"
    // Use the status from whichever source has the higher block number
    const source1Block = sources.find((s) => s.up)?.result.data?.blockNumber || 0;
    const source2Block = sources.filter((s) => s.up)[1]?.result.data?.blockNumber || 0;

    const finalStatus = source1Block >= source2Block ? status1 : status2;

    return {
      status: finalStatus,
      blockData: mostRecentBlock,
      primaryUp,
      secondaryUp,
      tertiaryUp,
    };
  }

  // All 3 sources up - use consensus
  const [status1, status2, status3] = statuses;

  // All agree
  if (status1 === status2 && status2 === status3) {
    return {
      status: status1,
      blockData: mostRecentBlock,
      primaryUp: true,
      secondaryUp: true,
      tertiaryUp: true,
    };
  }

  // Find majority consensus or use most pessimistic
  const statusCounts = new Map<ChainStatusType, number>();
  statuses.forEach((status) => {
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  // Check if any status has majority (2 or more)
  let majorityStatus: ChainStatusType | null = null;
  for (const [status, count] of statusCounts.entries()) {
    if (count >= 2) {
      majorityStatus = status;
      break;
    }
  }

  if (majorityStatus) {
    return {
      status: majorityStatus,
      blockData: mostRecentBlock,
      primaryUp: true,
      secondaryUp: true,
      tertiaryUp: true,
    };
  }

  // No consensus - use most pessimistic
  const statusPriority: ChainStatusType[] = [
    "halted",
    "slow",
    "degraded",
    "healthy",
  ];

  const finalStatus = statuses.reduce((mostPessimistic, current) =>
    statusPriority.indexOf(current) < statusPriority.indexOf(mostPessimistic)
      ? current
      : mostPessimistic
  );

  return {
    status: finalStatus,
    blockData: mostRecentBlock,
    primaryUp: true,
    secondaryUp: true,
    tertiaryUp: true,
  };
}

/**
 * Calculates uptime percentage for a given time range
 */
export function calculateUptimePercent(
  totalSeconds: number,
  downtimeSeconds: number
): number {
  if (totalSeconds <= 0) return 100;
  const uptime = ((totalSeconds - downtimeSeconds) / totalSeconds) * 100;
  return Math.max(0, Math.min(100, Number(uptime.toFixed(2))));
}
