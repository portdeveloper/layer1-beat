import { ChainAdapter, SourceResult } from "../types";

const TRONGRID_API = "https://api.trongrid.io";
const SECONDARY_API = "https://api.tronstack.io";
const NILE_GRID_API = "https://nile.trongrid.io";

export class TronAdapter implements ChainAdapter {
  chainId = "tron";
  primarySourceName = "TronGrid";
  secondarySourceName = "TronStack";
  tertiarySourceName = "TronGrid";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromTronGrid(TRONGRID_API, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromTronGrid(SECONDARY_API, "secondary", this.secondarySourceName);
  }

  async fetchTertiary(): Promise<SourceResult> {
    // Use TronGrid API for tertiary as well since it's more reliable
    return this.fetchFromTronGrid("https://api.trongrid.io", "tertiary", this.tertiarySourceName);
  }

  private async fetchFromTronGrid(
    apiUrl: string,
    source: "primary" | "secondary" | "tertiary",
    sourceName: string
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${apiUrl}/wallet/getnowblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Tron API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.block_header) {
        throw new Error("No block header in response");
      }

      const blockNumber = data.block_header.raw_data.number;
      const blockTimestamp = Math.floor(data.block_header.raw_data.timestamp / 1000);

      if (!blockNumber || !blockTimestamp) {
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
