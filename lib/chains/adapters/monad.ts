import { ChainAdapter, SourceResult } from "../types";

const RPC_URL = "https://rpc.monad.xyz";
const SECONDARY_RPC_URL = "https://rpc1.monad.xyz";
const TERTIARY_RPC_URL = "https://rpc2.monad.xyz";

export class MonadAdapter implements ChainAdapter {
  chainId = "monad";
  primarySourceName = "Monad RPC";
  secondarySourceName = "Monad RPC1";
  tertiarySourceName = "Monad RPC2";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(RPC_URL, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromRpc(SECONDARY_RPC_URL, "secondary", this.secondarySourceName);
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromRpc(TERTIARY_RPC_URL, "tertiary", this.tertiarySourceName);
  }

  private async fetchFromRpc(
    rpcUrl: string,
    source: "primary" | "secondary" | "tertiary",
    sourceName: string
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const blockNumRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });

      if (!blockNumRes.ok) {
        throw new Error(`Monad RPC request failed: ${blockNumRes.status}`);
      }

      const blockNumData = await blockNumRes.json();
      if (blockNumData.error || !blockNumData.result) {
        throw new Error(blockNumData.error?.message || "No block number returned");
      }
      const blockNumber = parseInt(blockNumData.result, 16);
      if (isNaN(blockNumber)) {
        throw new Error("Invalid block number");
      }

      const blockRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: [blockNumData.result, false],
          id: 2,
        }),
      });

      if (!blockRes.ok) {
        throw new Error(`Monad RPC request failed: ${blockRes.status}`);
      }

      const blockData = await blockRes.json();
      if (blockData.error || !blockData.result) {
        throw new Error(blockData.error?.message || "No block data returned");
      }
      const blockTimestamp = parseInt(blockData.result.timestamp, 16);
      if (isNaN(blockTimestamp)) {
        throw new Error("Invalid block timestamp");
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
