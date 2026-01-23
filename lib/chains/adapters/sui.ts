import { ChainAdapter, SourceResult } from "../types";

const SUI_RPC = "https://fullnode.mainnet.sui.io";
const SECONDARY_RPC = "https://sui-rpc.publicnode.com";
const TERTIARY_RPC = "https://sui-mainnet.nodeinfra.com";

export class SuiAdapter implements ChainAdapter {
  chainId = "sui";
  primarySourceName = "Sui RPC";
  secondarySourceName = "PublicNode";
  tertiarySourceName = "NodeInfra";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(SUI_RPC, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromRpc(SECONDARY_RPC, "secondary", this.secondarySourceName);
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromRpc(TERTIARY_RPC, "tertiary", this.tertiarySourceName);
  }

  private async fetchFromRpc(
    rpcUrl: string,
    source: "primary" | "secondary" | "tertiary",
    sourceName: string
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sui_getLatestCheckpointSequenceNumber",
          params: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Sui RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Sui RPC error");
      }

      const checkpointNumber = parseInt(data.result);
      if (isNaN(checkpointNumber)) {
        throw new Error("Invalid checkpoint number");
      }

      // Get checkpoint details for timestamp
      const checkpointRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "sui_getCheckpoint",
          params: [checkpointNumber.toString()],
        }),
      });

      if (!checkpointRes.ok) {
        throw new Error(`Sui RPC request failed: ${checkpointRes.status}`);
      }

      const checkpointData = await checkpointRes.json();
      if (checkpointData.error || !checkpointData.result) {
        throw new Error(checkpointData.error?.message || "No checkpoint data");
      }

      // Sui timestamp is in milliseconds
      const blockTimestamp = Math.floor(
        parseInt(checkpointData.result.timestampMs) / 1000
      );

      return {
        success: true,
        data: { blockNumber: checkpointNumber, blockTimestamp },
        source,
        sourceName,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source,
        sourceName,
        latencyMs: Date.now() - start,
      };
    }
  }
}
