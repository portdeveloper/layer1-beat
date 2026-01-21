import { ChainAdapter, SourceResult } from "../types";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const TERTIARY_RPC = "https://solana-mainnet.g.alchemy.com/v2/demo";

export class SolanaAdapter implements ChainAdapter {
  chainId = "solana";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(SOLANA_RPC, "primary");
  }

  async fetchSecondary(): Promise<SourceResult> {
    const apiKey = process.env.HELIUS_API_KEY;
    const rpcUrl = apiKey
      ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
      : "https://rpc.ankr.com/solana";
    return this.fetchFromRpc(rpcUrl, "secondary");
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromRpc(TERTIARY_RPC, "tertiary");
  }

  private async fetchFromRpc(
    rpcUrl: string,
    source: "primary" | "secondary" | "tertiary"
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const slotRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSlot",
          params: [{ commitment: "finalized" }],
        }),
      });

      if (!slotRes.ok) {
        throw new Error(`Solana RPC request failed: ${slotRes.status}`);
      }

      const slotData = await slotRes.json();
      if (slotData.error) {
        throw new Error(slotData.error.message || "Solana RPC error");
      }
      const blockNumber = slotData.result;

      const blockTimeRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "getBlockTime",
          params: [blockNumber],
        }),
      });

      if (!blockTimeRes.ok) {
        throw new Error(`Solana RPC request failed: ${blockTimeRes.status}`);
      }

      const blockTimeData = await blockTimeRes.json();
      if (blockTimeData.error) {
        throw new Error(blockTimeData.error.message || "Solana RPC error");
      }
      const blockTimestamp = blockTimeData.result;

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
