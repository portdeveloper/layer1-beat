"use client";

import { use } from "react";
import Link from "next/link";
import { useChainDetail } from "@/hooks/use-chain-status";
import { StatusIndicator, SourceIndicator } from "@/components/status-indicator";
import { UptimeChart } from "@/components/uptime-chart";

function formatTimeSince(seconds: number | null): string {
  if (seconds === null) return "N/A";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatBlockNumber(num: number | null): string {
  if (num === null) return "N/A";
  return num.toLocaleString();
}

function formatUptime(percent: number | null): string {
  if (percent === null) return "N/A";
  return `${percent.toFixed(2)}%`;
}

export default function ChainDetailPage({
  params,
}: {
  params: Promise<{ chainId: string }>;
}) {
  const { chainId } = use(params);
  const { chain, snapshots, haltEvents, isLoading, isError } =
    useChainDetail(chainId);

  if (isLoading && !chain) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mb-4" />
          <p className="text-gray-500">Loading chain data...</p>
        </div>
      </div>
    );
  }

  if (isError || !chain) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Chain not found</div>
          <Link href="/" className="text-blue-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm mb-6 inline-block"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{chain.name}</h1>
            <p className="text-gray-400 mt-1">Chain ID: {chain.chainId}</p>
          </div>
          <StatusIndicator status={chain.status} size="lg" showLabel />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-lg font-mono text-white">
              {formatBlockNumber(chain.latestBlockNumber)}
            </div>
            <div className="text-sm text-gray-500">Latest Block</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-lg text-white">
              {formatTimeSince(chain.timeSinceLastBlock)}
            </div>
            <div className="text-sm text-gray-500">Last Block</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-lg text-white">{chain.expectedBlockTime}s</div>
            <div className="text-sm text-gray-500">Expected Block Time</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <SourceIndicator
                primaryUp={chain.primarySourceStatus === "up"}
                secondaryUp={chain.secondarySourceStatus === "up"}
                tertiaryUp={chain.tertiarySourceStatus === "up"}
              />
            </div>
            <div className="text-sm text-gray-500 mt-1">Data Sources</div>
          </div>
        </div>

        {/* Uptime Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Uptime Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div
                className={`text-2xl font-bold ${
                  chain.uptimePercent24h !== null && chain.uptimePercent24h >= 99
                    ? "text-green-400"
                    : chain.uptimePercent24h !== null &&
                      chain.uptimePercent24h >= 95
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {formatUptime(chain.uptimePercent24h)}
              </div>
              <div className="text-sm text-gray-500">24 Hours</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${
                  chain.uptimePercent7d !== null && chain.uptimePercent7d >= 99
                    ? "text-green-400"
                    : chain.uptimePercent7d !== null &&
                      chain.uptimePercent7d >= 95
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {formatUptime(chain.uptimePercent7d)}
              </div>
              <div className="text-sm text-gray-500">7 Days</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${
                  chain.uptimePercent30d !== null && chain.uptimePercent30d >= 99
                    ? "text-green-400"
                    : chain.uptimePercent30d !== null &&
                      chain.uptimePercent30d >= 95
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {formatUptime(chain.uptimePercent30d)}
              </div>
              <div className="text-sm text-gray-500">30 Days</div>
            </div>
          </div>
        </div>

        {/* Uptime Chart */}
        <UptimeChart haltEvents={haltEvents} />

        {/* Recent Snapshots */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Block Snapshots</h3>
          {snapshots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="pb-2">Block</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.slice(0, 10).map((snapshot, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 font-mono text-gray-300">
                        {snapshot.blockNumber.toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-400">
                        {new Date(snapshot.blockTimestamp * 1000).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            snapshot.source === "primary"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {snapshot.source}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(snapshot.recordedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No snapshots recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
