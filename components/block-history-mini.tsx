"use client";

import { useEffect, useState } from "react";

interface BlockHistoryMiniProps {
  chainId: string;
  expectedBlockTime: number;
}

interface BlockSnapshot {
  blockNumber: number;
  blockTimestamp: number;
  recordedAt: string;
  source: string;
}

export function BlockHistoryMini({ chainId, expectedBlockTime }: BlockHistoryMiniProps) {
  const [snapshots, setSnapshots] = useState<BlockSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const res = await fetch(`/api/chain/${chainId}`);
        if (res.ok) {
          const data = await res.json();
          setSnapshots(data.snapshots.slice(0, 20)); // Last 20 snapshots
        }
      } catch (err) {
        console.error("Failed to fetch snapshots:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSnapshots, 30000);
    return () => clearInterval(interval);
  }, [chainId]);

  if (loading) {
    return (
      <div className="flex items-end gap-1 h-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-10 bg-gray-700 rounded-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex items-end gap-1 h-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-2 h-10 bg-gray-700 rounded-sm" />
        ))}
      </div>
    );
  }

  // Calculate block time differences
  const blockTimes = [];
  for (let i = 0; i < snapshots.length - 1; i++) {
    const timeDiff =
      new Date(snapshots[i].recordedAt).getTime() -
      new Date(snapshots[i + 1].recordedAt).getTime();
    const blockDiff = snapshots[i].blockNumber - snapshots[i + 1].blockNumber;
    if (blockDiff > 0) {
      const avgBlockTime = timeDiff / blockDiff / 1000; // Convert to seconds
      blockTimes.push(avgBlockTime);
    }
  }

  // Determine bar color based on block time vs expected
  const getBarColor = (blockTime: number) => {
    const ratio = blockTime / expectedBlockTime;
    if (ratio <= 1.2) return "bg-green-500"; // Within 20% of expected - healthy
    if (ratio <= 1.5) return "bg-yellow-500"; // 20-50% slower - warning
    if (ratio <= 2.0) return "bg-orange-500"; // 50-100% slower - concerning
    return "bg-red-500"; // More than 2x slower - critical
  };

  // Normalize heights (max height = 100%, min = 30%)
  const maxBlockTime = Math.max(...blockTimes, expectedBlockTime * 2);
  const getBarHeight = (blockTime: number) => {
    const normalized = (blockTime / maxBlockTime) * 100;
    return Math.max(30, Math.min(100, normalized)); // Between 30% and 100%
  };

  return (
    <div className="flex items-end gap-1 h-10">
      {blockTimes.slice(0, 20).reverse().map((time, i) => (
        <div
          key={i}
          className={`w-2 rounded-sm transition-all ${getBarColor(time)}`}
          style={{ height: `${getBarHeight(time)}%` }}
          title={`Block time: ${time.toFixed(1)}s (expected: ${expectedBlockTime}s)`}
        />
      ))}
    </div>
  );
}
