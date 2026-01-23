import { ChainAdapter, SourceResult } from "../types";

const APTOS_RPC = "https://fullnode.mainnet.aptoslabs.com/v1";
const SECONDARY_RPC = "https://rpc.ankr.com/premium-http/aptos/3c1504db9f2d7292b8a63f447ae7443163a563b451054f11e5786264ef82e438/v1";
const TERTIARY_RPC = "https://1rpc.io/aptos/v1";

export class AptosAdapter implements ChainAdapter {
  chainId = "aptos";
  primarySourceName = "Aptos Labs";
  secondarySourceName = "Ankr";
  tertiarySourceName = "1RPC";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(APTOS_RPC, "primary", this.primarySourceName);
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
      // Get latest ledger info
      const response = await fetch(`${rpcUrl}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Aptos API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.block_height || !data.ledger_timestamp) {
        throw new Error("Invalid ledger info");
      }

      const blockNumber = parseInt(data.block_height);
      // Aptos timestamp is in microseconds
      const blockTimestamp = Math.floor(parseInt(data.ledger_timestamp) / 1000000);

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
