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
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight leading-tight">L1Beat</h1>
          <p className="text-gray-400 text-base sm:text-lg mb-6 leading-relaxed">
            Real-time uptime monitoring for Layer 1 blockchains
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-sm sm:text-base">
            <span className="text-green-400 font-medium">{healthyCount} healthy</span>
            {issueCount > 0 && (
              <span className="text-red-400 font-medium">{issueCount} issues</span>
            )}
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="text-sm text-gray-500">
              {timestamp
                ? `Updated ${new Date(timestamp).toLocaleTimeString()}`
                : "Loading..."}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && chains.length === 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="inline-block animate-spin w-10 h-10 border-2 border-gray-700 border-t-white rounded-full mb-4" />
            <p className="text-gray-500">Loading chain statuses...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-red-500 mb-2 text-lg">Failed to load chain data</div>
            <p className="text-gray-500 text-sm">
              Make sure the polling service is running
            </p>
          </div>
        )}

        {/* Chain Table */}
        {chains.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm">Chain</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm text-right">Block</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm text-right">Last Block</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm text-right">24h</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm text-right">7d</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-sm text-center">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {chains.map((chain) => (
                    <tr
                      key={chain.chainId}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/chain/${chain.chainId}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors text-base"
                        >
                          {chain.name}
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <StatusIndicator status={chain.status} size="sm" showLabel />
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-gray-300 text-sm">
                        {formatBlockNumber(chain.latestBlockNumber)}
                      </td>
                      <td className="px-6 py-5 text-right text-gray-400 text-sm">
                        {formatTimeSince(chain.timeSinceLastBlock)} ago
                      </td>
                      <td className="px-6 py-5 text-right text-sm">
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
                      <td className="px-6 py-5 text-right text-sm">
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
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <SourceIndicator
                            primaryUp={chain.primarySourceStatus === "up"}
                            secondaryUp={chain.secondarySourceStatus === "up"}
                            tertiaryUp={chain.tertiarySourceStatus === "up"}
                            primaryName={chain.primarySourceName}
                            secondaryName={chain.secondarySourceName}
                            tertiaryName={chain.tertiarySourceName}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          Data refreshes every 10 seconds • Triple-source verification
        </div>
      </div>
    </div>
  );
}
