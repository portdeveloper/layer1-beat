import { ChainAdapter, SourceResult } from "../types";

const TON_API = "https://toncenter.com/api/v2";
const DRPC_API = "https://ton.drpc.org";
const ANKR_API = "https://rpc.ankr.com/premium-http/ton_api_v2/3c1504db9f2d7292b8a63f447ae7443163a563b451054f11e5786264ef82e438";

export class TonAdapter implements ChainAdapter {
  chainId = "ton";
  primarySourceName = "TONCenter";
  secondarySourceName = "dRPC";
  tertiarySourceName = "Ankr";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromTonCenter(TON_API, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromJsonRpc(DRPC_API, "secondary", this.secondarySourceName);
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromTonCenter(ANKR_API, "tertiary", this.tertiarySourceName);
  }

  private async fetchFromTonCenter(
    apiUrl: string,
    source: "primary" | "secondary" | "tertiary",
    sourceName: string
  ): Promise<SourceResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${apiUrl}/getMasterchainInfo`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`TON API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok || !data.result) {
        throw new Error("Invalid TON API response");
      }

      const blockNumber = data.result.last.seqno;
      // Use current time as TON doesn't expose block timestamp easily
      const blockTimestamp = Math.floor(Date.now() / 1000);

      if (isNaN(blockNumber)) {
        throw new Error("Invalid block number");
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

  private async fetchFromJsonRpc(
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
          method: "getMasterchainInfo",
          params: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`TON RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "TON RPC error");
      }

      if (!data.result || !data.result.last) {
        throw new Error("Invalid TON RPC response");
      }

      const blockNumber = data.result.last.seqno;
      const blockTimestamp = Math.floor(Date.now() / 1000);

      if (isNaN(blockNumber)) {
        throw new Error("Invalid block number");
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
