import { ChainAdapter, SourceResult } from "../types";

const NEAR_RPC = "https://rpc.mainnet.near.org";
const SECONDARY_RPC = "https://near.drpc.org";
const TERTIARY_RPC = "https://endpoints.omniatech.io/v1/near/mainnet/public";

export class NearAdapter implements ChainAdapter {
  chainId = "near";
  primarySourceName = "NEAR RPC";
  secondarySourceName = "dRPC";
  tertiarySourceName = "Omniatech";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(NEAR_RPC, "primary", this.primarySourceName);
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
          id: "dontcare",
          method: "block",
          params: { finality: "final" },
        }),
      });

      if (!response.ok) {
        throw new Error(`NEAR RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "NEAR RPC error");
      }

      if (!data.result || !data.result.header) {
        throw new Error("No block data returned");
      }

      const blockNumber = data.result.header.height;
      // NEAR timestamp is in nanoseconds
      const blockTimestamp = Math.floor(
        parseInt(data.result.header.timestamp) / 1000000000
      );

      if (isNaN(blockNumber) || isNaN(blockTimestamp)) {
        throw new Error("Invalid block data");
      }

      return {
        success: true,
        data: { blockNumber, blockTimestamp },
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
