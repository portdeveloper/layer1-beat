import { ChainConfig, ChainAdapter } from "./types";
import { EthereumAdapter } from "./adapters/ethereum";
import { BitcoinAdapter } from "./adapters/bitcoin";
import { SolanaAdapter } from "./adapters/solana";
import { BnbAdapter } from "./adapters/bnb";
import { AvalancheAdapter } from "./adapters/avalanche";
import { MonadAdapter } from "./adapters/monad";
import { PolygonAdapter } from "./adapters/polygon";
import { TronAdapter } from "./adapters/tron";
import { PolkadotAdapter } from "./adapters/polkadot";
import { SuiAdapter } from "./adapters/sui";
import { AptosAdapter } from "./adapters/aptos";
import { CardanoAdapter } from "./adapters/cardano";
import { NearAdapter } from "./adapters/near";
import { TonAdapter } from "./adapters/ton";

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
  {
    id: "polygon",
    name: "Polygon",
    expectedBlockTime: 2,
    haltThreshold: 30,
  },
  {
    id: "tron",
    name: "Tron",
    expectedBlockTime: 3,
    haltThreshold: 45,
  },
  {
    id: "polkadot",
    name: "Polkadot",
    expectedBlockTime: 6,
    haltThreshold: 90,
  },
  {
    id: "sui",
    name: "Sui",
    expectedBlockTime: 3,
    haltThreshold: 45,
  },
  {
    id: "aptos",
    name: "Aptos",
    expectedBlockTime: 4,
    haltThreshold: 60,
  },
  {
    id: "cardano",
    name: "Cardano",
    expectedBlockTime: 20,
    haltThreshold: 300,
  },
  {
    id: "near",
    name: "NEAR Protocol",
    expectedBlockTime: 1,
    haltThreshold: 15,
  },
  {
    id: "ton",
    name: "TON",
    expectedBlockTime: 5,
    haltThreshold: 75,
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
    case "polygon":
      return new PolygonAdapter();
    case "tron":
      return new TronAdapter();
    case "polkadot":
      return new PolkadotAdapter();
    case "sui":
      return new SuiAdapter();
    case "aptos":
      return new AptosAdapter();
    case "cardano":
      return new CardanoAdapter();
    case "near":
      return new NearAdapter();
    case "ton":
      return new TonAdapter();
    default:
      return undefined;
  }
}

export function getAllAdapters(): ChainAdapter[] {
  return CHAIN_CONFIGS.map((config) => getChainAdapter(config.id)!);
}
