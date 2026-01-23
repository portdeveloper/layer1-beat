import { ChainAdapter, SourceResult } from "../types";

const BLOCKFROST_API = "https://cardano-mainnet.blockfrost.io/api/v0";
const KOIOS_API = "https://api.koios.rest/api/v1";
const TERTIARY_API = "https://cardano-mainnet-rpc.allthatnode.com";

export class CardanoAdapter implements ChainAdapter {
  chainId = "cardano";
  primarySourceName = "Koios";
  secondarySourceName = "Koios";
  tertiarySourceName = "Koios";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromKoios("primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromKoios("secondary", this.secondarySourceName);
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromKoios("tertiary", this.tertiarySourceName);
  }

  private async fetchFromKoios(
    source: "primary" | "secondary" | "tertiary",
    sourceName: string
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${KOIOS_API}/tip`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Koios API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error("No tip data returned");
      }

      const tip = data[0];
      const blockNumber = parseInt(tip.block_no);
      // Cardano timestamp is in seconds
      const blockTimestamp = parseInt(tip.block_time);

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
