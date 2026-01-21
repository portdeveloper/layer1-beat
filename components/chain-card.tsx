"use client";

import Link from "next/link";
import { ChainStatusInfo } from "@/lib/chains/types";
import { StatusIndicator, SourceIndicator } from "./status-indicator";

interface ChainCardProps {
  chain: ChainStatusInfo;
}

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

export function ChainCard({ chain }: ChainCardProps) {
  return (
    <Link href={`/chain/${chain.chainId}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{chain.name}</h3>
          <StatusIndicator status={chain.status} size="md" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Latest Block</span>
            <span className="text-gray-300 font-mono">
              {formatBlockNumber(chain.latestBlockNumber)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Block</span>
            <span className="text-gray-300">
              {formatTimeSince(chain.timeSinceLastBlock)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Uptime (24h)</span>
            <span
              className={`font-medium ${
                chain.uptimePercent24h !== null && chain.uptimePercent24h >= 99
                  ? "text-green-400"
                  : chain.uptimePercent24h !== null &&
                    chain.uptimePercent24h >= 95
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {formatUptime(chain.uptimePercent24h)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-800">
            <span className="text-gray-500">Sources</span>
            <SourceIndicator
              primaryUp={chain.primarySourceStatus === "up"}
              secondaryUp={chain.secondarySourceStatus === "up"}
              tertiaryUp={chain.tertiarySourceStatus === "up"}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
