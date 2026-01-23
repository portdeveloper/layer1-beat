import { ChainAdapter, SourceResult } from "../types";

const RPC_URL = "https://api.avax.network/ext/bc/C/rpc";
const SNOWTRACE_API = "https://api.snowtrace.io/api";
const TERTIARY_RPC_URL = "https://avalanche-c-chain-rpc.publicnode.com";

export class AvalancheAdapter implements ChainAdapter {
  chainId = "avalanche";
  primarySourceName = "Avalanche API";
  secondarySourceName = "Snowtrace";
  tertiarySourceName = "PublicNode";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(RPC_URL, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    const start = Date.now();
    const apiKey = process.env.SNOWTRACE_API_KEY || "";

    try {
      const blockNumRes = await fetch(
        `${SNOWTRACE_API}?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
      );

      if (!blockNumRes.ok) {
        throw new Error(`Snowtrace request failed: ${blockNumRes.status}`);
      }

      const blockNumData = await blockNumRes.json();
      if (blockNumData.error) {
        throw new Error(blockNumData.error.message || "Snowtrace API error");
      }

      const blockNumber = parseInt(blockNumData.result, 16);

      const blockRes = await fetch(
        `${SNOWTRACE_API}?module=proxy&action=eth_getBlockByNumber&tag=${blockNumData.result}&boolean=false&apikey=${apiKey}`
      );

      if (!blockRes.ok) {
        throw new Error(`Snowtrace request failed: ${blockRes.status}`);
      }

      const blockData = await blockRes.json();
      if (blockData.error) {
        throw new Error(blockData.error.message || "Snowtrace API error");
      }

      const blockTimestamp = parseInt(blockData.result.timestamp, 16);

      return {
        success: true,
        data: { blockNumber, blockTimestamp },
        source: "secondary",
        sourceName: this.secondarySourceName,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "secondary",
        sourceName: this.secondarySourceName,
        latencyMs: Date.now() - start,
      };
    }
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
        throw new Error(`Avalanche RPC request failed: ${blockNumRes.status}`);
      }

      const blockNumData = await blockNumRes.json();
      const blockNumber = parseInt(blockNumData.result, 16);

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
        throw new Error(`Avalanche RPC request failed: ${blockRes.status}`);
      }

      const blockData = await blockRes.json();
      const blockTimestamp = parseInt(blockData.result.timestamp, 16);

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
