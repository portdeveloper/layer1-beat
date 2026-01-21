import { ChainAdapter, SourceResult } from "../types";

const RPC_URL = "https://bsc-dataseed1.binance.org";
const SECONDARY_RPC_URL = "https://bsc-dataseed2.binance.org";
const TERTIARY_RPC_URL = "https://bsc-dataseed3.binance.org";

export class BnbAdapter implements ChainAdapter {
  chainId = "bnb";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(RPC_URL, "primary");
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromRpc(SECONDARY_RPC_URL, "secondary");
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromRpc(TERTIARY_RPC_URL, "tertiary");
  }

  private async fetchFromRpc(
    rpcUrl: string,
    source: "primary" | "secondary" | "tertiary"
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
        throw new Error(`BNB RPC request failed: ${blockNumRes.status}`);
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
        throw new Error(`BNB RPC request failed: ${blockRes.status}`);
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
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source,
        latencyMs: Date.now() - start,
      };
    }
  }
}
