import { ChainAdapter, SourceResult } from "../types";

const BLOCKSTREAM_API = "https://blockstream.info/api";
const MEMPOOL_API = "https://mempool.space/api";
const BLOCKCHAIN_INFO_API = "https://blockchain.info";

export class BitcoinAdapter implements ChainAdapter {
  chainId = "bitcoin";
  primarySourceName = "Blockstream";
  secondarySourceName = "Mempool";
  tertiarySourceName = "Blockchain.info";

  async fetchPrimary(): Promise<SourceResult> {
    return this.fetchFromBlockstream();
  }

  async fetchSecondary(): Promise<SourceResult> {
    return this.fetchFromMempool();
  }

  async fetchTertiary(): Promise<SourceResult> {
    return this.fetchFromBlockchainInfo();
  }

  private async fetchFromBlockstream(): Promise<SourceResult> {
    const start = Date.now();
    try {
      const heightRes = await fetch(`${BLOCKSTREAM_API}/blocks/tip/height`);
      if (!heightRes.ok) {
        throw new Error(`Blockstream request failed: ${heightRes.status}`);
      }
      const blockNumber = parseInt(await heightRes.text(), 10);

      const hashRes = await fetch(`${BLOCKSTREAM_API}/blocks/tip/hash`);
      if (!hashRes.ok) {
        throw new Error(`Blockstream request failed: ${hashRes.status}`);
      }
      const blockHash = await hashRes.text();

      const blockRes = await fetch(`${BLOCKSTREAM_API}/block/${blockHash}`);
      if (!blockRes.ok) {
        throw new Error(`Blockstream request failed: ${blockRes.status}`);
      }
      const blockData = await blockRes.json();
      const blockTimestamp = blockData.timestamp;

      return {
        success: true,
        data: { blockNumber, blockTimestamp },
        source: "primary",
        sourceName: this.primarySourceName,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "primary",
        sourceName: this.primarySourceName,
        latencyMs: Date.now() - start,
      };
    }
  }

  private async fetchFromMempool(): Promise<SourceResult> {
    const start = Date.now();
    try {
      const heightRes = await fetch(`${MEMPOOL_API}/blocks/tip/height`);
      if (!heightRes.ok) {
        throw new Error(`Mempool.space request failed: ${heightRes.status}`);
      }
      const blockNumber = parseInt(await heightRes.text(), 10);

      const hashRes = await fetch(`${MEMPOOL_API}/blocks/tip/hash`);
      if (!hashRes.ok) {
        throw new Error(`Mempool.space request failed: ${hashRes.status}`);
      }
      const blockHash = await hashRes.text();

      const blockRes = await fetch(`${MEMPOOL_API}/block/${blockHash}`);
      if (!blockRes.ok) {
        throw new Error(`Mempool.space request failed: ${blockRes.status}`);
      }
      const blockData = await blockRes.json();
      const blockTimestamp = blockData.timestamp;

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

  private async fetchFromBlockchainInfo(): Promise<SourceResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${BLOCKCHAIN_INFO_API}/latestblock`);
      if (!res.ok) {
        throw new Error(`Blockchain.info request failed: ${res.status}`);
      }
      const data = await res.json();
      const blockNumber = data.height;
      const blockTimestamp = data.time;

      return {
        success: true,
        data: { blockNumber, blockTimestamp },
        source: "tertiary",
        sourceName: this.tertiarySourceName,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "tertiary",
        sourceName: this.tertiarySourceName,
        latencyMs: Date.now() - start,
      };
    }
  }
}
