export interface ChainConfig {
  id: string;
  name: string;
  expectedBlockTime: number; // in seconds
  haltThreshold: number; // in seconds
  icon?: string;
}

export interface BlockData {
  blockNumber: number;
  blockTimestamp: number; // unix timestamp in seconds
}

export interface SourceResult {
  success: boolean;
  data?: BlockData;
  error?: string;
  source: "primary" | "secondary" | "tertiary";
  sourceName?: string; // Human-readable source name (e.g., "LlamaRPC", "Etherscan")
  latencyMs?: number;
}

export interface ChainAdapter {
  chainId: string;
  primarySourceName: string;
  secondarySourceName: string;
  tertiarySourceName: string;
  fetchPrimary(): Promise<SourceResult>;
  fetchSecondary(): Promise<SourceResult>;
  fetchTertiary(): Promise<SourceResult>;
}

export type ChainStatusType =
  | "healthy"
  | "slow"
  | "halted"
  | "degraded"
  | "stale"
  | "unknown";

export interface ChainStatusInfo {
  chainId: string;
  name: string;
  status: ChainStatusType;
  latestBlockNumber: number | null;
  latestBlockTimestamp: number | null;
  timeSinceLastBlock: number | null; // in seconds
  primarySourceStatus: "up" | "down";
  secondarySourceStatus: "up" | "down";
  tertiarySourceStatus: "up" | "down";
  primarySourceName?: string;
  secondarySourceName?: string;
  tertiarySourceName?: string;
  uptimePercent24h: number | null;
  uptimePercent7d: number | null;
  uptimePercent30d: number | null;
  lastCheckedAt: Date | null;
  expectedBlockTime: number;
  haltThreshold: number;
}

export interface PollResult {
  chainId: string;
  primary: SourceResult;
  secondary: SourceResult;
  tertiary: SourceResult;
  determinedStatus: ChainStatusType;
  blockData: BlockData | null;
}
