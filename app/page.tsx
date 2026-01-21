"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useChainStatuses } from "@/hooks/use-chain-status";
import { StatusIndicator, SourceIndicator } from "@/components/status-indicator";

function formatTimeSince(seconds: number | null): string {
  if (seconds === null) return "-";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatBlockNumber(num: number | null): string {
  if (num === null) return "-";
  return num.toLocaleString();
}

function formatUptime(percent: number | null): string {
  if (percent === null) return "-";
  return `${percent.toFixed(2)}%`;
}

const SOURCE_NAMES: Record<string, { primary: string; secondary: string; tertiary: string }> = {
  ethereum: { primary: "Llama RPC", secondary: "Etherscan", tertiary: "Alchemy" },
  bitcoin: { primary: "Blockstream", secondary: "Mempool.space", tertiary: "Blockchain.com" },
  solana: { primary: "Solana RPC", secondary: "Helius", tertiary: "QuickNode" },
  bnb: { primary: "Binance RPC", secondary: "Binance RPC 2", tertiary: "BSCScan" },
  avalanche: { primary: "Avalanche RPC", secondary: "Snowtrace", tertiary: "Alchemy" },
  monad: { primary: "QuickNode", secondary: "Alchemy", tertiary: "Infura" },
};

export default function Dashboard() {
  const { chains, timestamp, isLoading, isError } = useChainStatuses();
  const [isPolling, setIsPolling] = useState(false);

  // Auto-trigger polling if data is empty or unknown
  useEffect(() => {
    const needsPolling = chains.length > 0 && chains.every((c) => c.status === "unknown");

    if (needsPolling && !isPolling && !isLoading) {
      setIsPolling(true);
      fetch("/api/internal/poll", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          console.log("Poll triggered:", data);
          // Data will auto-refresh via SWR
        })
        .catch((err) => {
          console.error("Poll failed:", err);
        })
        .finally(() => {
          setIsPolling(false);
        });
    }
  }, [chains, isPolling, isLoading]);

  const healthyCount = chains.filter((c) => c.status === "healthy").length;
  const issueCount = chains.filter(
    (c) => c.status === "slow" || c.status === "halted"
  ).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">L1Beat</h1>
            <p className="text-gray-400 text-sm">
              Real-time uptime monitoring for top Layer 1 blockchains
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="text-green-400">{healthyCount} healthy</span>
              {issueCount > 0 && (
                <span className="text-red-400">{issueCount} issues</span>
              )}
            </div>
            <div className="text-xs mt-1">
              {timestamp
                ? `Updated ${new Date(timestamp).toLocaleTimeString()}`
                : "Loading..."}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && chains.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mb-4" />
            <p className="text-gray-500">Loading chain statuses...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Failed to load chain data</div>
            <p className="text-gray-500 text-sm">
              Make sure the polling service is running
            </p>
          </div>
        )}

        {/* Chain Table */}
        {chains.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm text-gray-500">
                  <th className="px-4 py-3 font-medium">Chain</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Block</th>
                  <th className="px-4 py-3 font-medium text-right">Last Block</th>
                  <th className="px-4 py-3 font-medium text-right">24h</th>
                  <th className="px-4 py-3 font-medium text-right">7d</th>
                  <th className="px-4 py-3 font-medium text-center">Sources</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain) => (
                  <tr
                    key={chain.chainId}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/chain/${chain.chainId}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors"
                      >
                        {chain.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusIndicator status={chain.status} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300 text-sm">
                      {formatBlockNumber(chain.latestBlockNumber)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-sm">
                      {formatTimeSince(chain.timeSinceLastBlock)} ago
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={
                          chain.uptimePercent24h !== null && chain.uptimePercent24h >= 99
                            ? "text-green-400"
                            : chain.uptimePercent24h !== null && chain.uptimePercent24h >= 95
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {formatUptime(chain.uptimePercent24h)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={
                          chain.uptimePercent7d !== null && chain.uptimePercent7d >= 99
                            ? "text-green-400"
                            : chain.uptimePercent7d !== null && chain.uptimePercent7d >= 95
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {formatUptime(chain.uptimePercent7d)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <SourceIndicator
                          primaryUp={chain.primarySourceStatus === "up"}
                          secondaryUp={chain.secondarySourceStatus === "up"}
                          tertiaryUp={chain.tertiarySourceStatus === "up"}
                          primaryName={SOURCE_NAMES[chain.chainId]?.primary}
                          secondaryName={SOURCE_NAMES[chain.chainId]?.secondary}
                          tertiaryName={SOURCE_NAMES[chain.chainId]?.tertiary}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600">
          Data refreshes every 10 seconds. Dual-source verification.
        </div>
      </div>
    </div>
  );
}
