"use client";

import useSWR from "swr";
import { ChainStatusInfo } from "@/lib/chains/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ChainsResponse {
  chains: ChainStatusInfo[];
  timestamp: string;
}

interface ChainDetailResponse {
  chain: ChainStatusInfo;
  snapshots: Array<{
    blockNumber: number;
    blockTimestamp: number;
    source: string;
    recordedAt: string;
  }>;
  haltEvents: Array<{
    id: number;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
    severity: string;
  }>;
  timestamp: string;
}

export function useChainStatuses() {
  const { data, error, isLoading, mutate } = useSWR<ChainsResponse>(
    "/api/chains",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    chains: data?.chains ?? [],
    timestamp: data?.timestamp,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useChainDetail(chainId: string) {
  const { data, error, isLoading, mutate } = useSWR<ChainDetailResponse>(
    chainId ? `/api/chain/${chainId}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    chain: data?.chain,
    snapshots: data?.snapshots ?? [],
    haltEvents: data?.haltEvents ?? [],
    timestamp: data?.timestamp,
    isLoading,
    isError: !!error,
    mutate,
  };
}
