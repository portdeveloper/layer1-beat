import { ChainAdapter, SourceResult } from "../types";

const RPC_URL = "https://eth.llamarpc.com";
const ETHERSCAN_API = "https://api.etherscan.io/v2/api";
const CHAIN_ID = 1;
const TERTIARY_RPC_URL = "https://rpc.ankr.com/eth/3c1504db9f2d7292b8a63f447ae7443163a563b451054f11e5786264ef82e438";

export class EthereumAdapter implements ChainAdapter {
  chainId = "ethereum";
  primarySourceName = "LlamaRPC";
  secondarySourceName = "Etherscan";
  tertiarySourceName = "Ankr";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromRpc(RPC_URL, "primary", this.primarySourceName);
  }

  async fetchSecondary(): Promise<SourceResult> {
    const start = Date.now();
    const apiKey = process.env.ETHERSCAN_API_KEY || "";

    try {
      const blockNumRes = await fetch(
        `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=proxy&action=eth_blockNumber&apikey=${apiKey}`
      );

      if (!blockNumRes.ok) {
        throw new Error(`Etherscan request failed: ${blockNumRes.status}`);
      }

      const blockNumData = await blockNumRes.json();
      if (blockNumData.error || !blockNumData.result) {
        throw new Error(blockNumData.error?.message || "Etherscan API error");
      }

      const blockNumber = parseInt(blockNumData.result, 16);
      if (isNaN(blockNumber)) {
        throw new Error("Invalid block number");
      }

      const blockRes = await fetch(
        `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=proxy&action=eth_getBlockByNumber&tag=${blockNumData.result}&boolean=false&apikey=${apiKey}`
      );

      if (!blockRes.ok) {
        throw new Error(`Etherscan request failed: ${blockRes.status}`);
      }

      const blockData = await blockRes.json();
      if (blockData.error || !blockData.result) {
        throw new Error(blockData.error?.message || "Etherscan API error");
      }

      const blockTimestamp = parseInt(blockData.result.timestamp, 16);
      if (isNaN(blockTimestamp)) {
        throw new Error("Invalid block timestamp");
      }

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
        throw new Error(`RPC request failed: ${blockNumRes.status}`);
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
        throw new Error(`RPC request failed: ${blockRes.status}`);
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
