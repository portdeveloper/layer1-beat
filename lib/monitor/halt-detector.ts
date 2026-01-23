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

  // CRITICAL: Calculate status based on the MOST RECENT block only
  // If ANY source has recent data, the chain is up (not halted)
  // Only consider the chain halted if the newest block is too old
  const timeSinceLastBlock = now - mostRecentBlock.blockTimestamp;
  const chainStatus = determineStatusFromBlockTime(
    timeSinceLastBlock,
    config.expectedBlockTime
  );

  // Only 1 source up -> mark as degraded if healthy (reduced redundancy)
  if (upCount === 1) {
    return {
      status: chainStatus === "healthy" ? "degraded" : chainStatus,
      blockData: mostRecentBlock,
      primaryUp,
      secondaryUp,
      tertiaryUp,
    };
  }

  // 2 or 3 sources up -> sufficient redundancy, use actual chain status
  return {
    status: chainStatus,
    blockData: mostRecentBlock,
    primaryUp,
    secondaryUp,
    tertiaryUp,
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
