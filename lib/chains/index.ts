import { ChainConfig, ChainAdapter } from "./types";
import { EthereumAdapter } from "./adapters/ethereum";
import { BitcoinAdapter } from "./adapters/bitcoin";
import { SolanaAdapter } from "./adapters/solana";
import { BnbAdapter } from "./adapters/bnb";
import { AvalancheAdapter } from "./adapters/avalanche";
import { MonadAdapter } from "./adapters/monad";

export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    expectedBlockTime: 12,
    haltThreshold: 180,
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    expectedBlockTime: 600,
    haltThreshold: 3600,
  },
  {
    id: "solana",
    name: "Solana",
    // Using 15s to account for finalization delay (~32 slots = ~13s)
    // Actual slot time is 0.4s but finalized blocks have inherent delay
    expectedBlockTime: 15,
    haltThreshold: 300,
  },
  {
    id: "bnb",
    name: "BNB Chain",
    expectedBlockTime: 3,
    haltThreshold: 45,
  },
  {
    id: "avalanche",
    name: "Avalanche",
    expectedBlockTime: 2,
    haltThreshold: 30,
  },
  {
    id: "monad",
    name: "Monad",
    expectedBlockTime: 1,
    haltThreshold: 60,
  },
];

export function getChainConfig(chainId: string): ChainConfig | undefined {
  return CHAIN_CONFIGS.find((c) => c.id === chainId);
}

export function getChainAdapter(chainId: string): ChainAdapter | undefined {
  switch (chainId) {
    case "ethereum":
      return new EthereumAdapter();
    case "bitcoin":
      return new BitcoinAdapter();
    case "solana":
      return new SolanaAdapter();
    case "bnb":
      return new BnbAdapter();
    case "avalanche":
      return new AvalancheAdapter();
    case "monad":
      return new MonadAdapter();
    default:
      return undefined;
  }
}

export function getAllAdapters(): ChainAdapter[] {
  return CHAIN_CONFIGS.map((config) => getChainAdapter(config.id)!);
}
