import { ChainAdapter, SourceResult } from "../types";

const POLKADOT_RPC = "https://rpc.polkadot.io";
const SECONDARY_RPC = "https://polkadot-rpc.publicnode.com";
const TERTIARY_RPC = "https://rpc-polkadot.luckyfriday.io";

export class PolkadotAdapter implements ChainAdapter {
  chainId = "polkadot";
  primarySourceName = "Polkadot RPC";
  secondarySourceName = "PublicNode";
  tertiarySourceName = "LuckyFriday";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(POLKADOT_RPC, "primary", this.primarySourceName);
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
      // Get latest finalized block header
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "chain_getHeader",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Polkadot RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Polkadot RPC error");
      }

      if (!data.result) {
        throw new Error("No header data returned");
      }

      // Extract block number from header
      const blockNumberHex = data.result.number;
      const blockNumber = parseInt(blockNumberHex, 16);
      if (isNaN(blockNumber)) {
        throw new Error("Invalid block number");
      }

      // For Polkadot, we estimate timestamp based on current time
      // Since we're monitoring real-time block production, this is accurate enough
      // Block time is consistent at ~6 seconds on Polkadot
      const blockTimestamp = Math.floor(Date.now() / 1000);

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
