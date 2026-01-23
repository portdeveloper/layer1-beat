"use client";

import { ChainStatusType } from "@/lib/chains/types";

interface StatusIndicatorProps {
  status: ChainStatusType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig: Record<
  ChainStatusType,
  { color: string; bgColor: string; label: string; pulse: boolean }
> = {
  healthy: {
    color: "bg-green-500",
    bgColor: "bg-green-500/20",
    label: "Healthy",
    pulse: false,
  },
  slow: {
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/20",
    label: "Slow",
    pulse: true,
  },
  halted: {
    color: "bg-red-500",
    bgColor: "bg-red-500/20",
    label: "Halted",
    pulse: true,
  },
  degraded: {
    color: "bg-orange-500",
    bgColor: "bg-orange-500/20",
    label: "Degraded",
    pulse: false,
  },
  stale: {
    color: "bg-purple-500",
    bgColor: "bg-purple-500/20",
    label: "Stale",
    pulse: true,
  },
  unknown: {
    color: "bg-gray-500",
    bgColor: "bg-gray-500/20",
    label: "Unknown",
    pulse: false,
  },
};

const sizeConfig = {
  sm: { dot: "w-2 h-2", text: "text-xs" },
  md: { dot: "w-3 h-3", text: "text-sm" },
  lg: { dot: "w-4 h-4", text: "text-base" },
};

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizes.dot}`}>
        <span
          className={`absolute inset-0 rounded-full ${config.color} ${
            config.pulse ? "animate-ping opacity-75" : ""
          }`}
        />
        <span
          className={`relative block rounded-full ${config.color} ${sizes.dot}`}
        />
      </div>
      {showLabel && (
        <span className={`font-medium ${sizes.text} text-gray-300`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

function SourceBadge({
  number,
  isUp,
  name,
  inactive = false,
}: {
  number: number;
  isUp: boolean;
  name?: string;
  inactive?: boolean;
}) {
  return (
    <div className="relative group/badge">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold cursor-default ${
          inactive
            ? "bg-gray-500/10 text-gray-500 border border-gray-500/20"
            : isUp
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}
      >
        {number}
      </span>
      {/* Individual tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs whitespace-nowrap opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all z-10 shadow-lg">
        <span className={inactive ? "text-gray-500" : isUp ? "text-green-400" : "text-red-400"}>
          {name || (inactive ? "Coming soon" : `Source ${number}`)}
        </span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
      </div>
    </div>
  );
}

export function SourceIndicator({
  primaryUp,
  secondaryUp,
  tertiaryUp,
  primaryName,
  secondaryName,
  tertiaryName,
}: {
  primaryUp: boolean;
  secondaryUp: boolean;
  tertiaryUp: boolean;
  primaryName?: string;
  secondaryName?: string;
  tertiaryName?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <SourceBadge number={1} isUp={primaryUp} name={primaryName} />
      <SourceBadge number={2} isUp={secondaryUp} name={secondaryName} />
      <SourceBadge number={3} isUp={tertiaryUp} name={tertiaryName} />
      <SourceBadge number={4} isUp={false} inactive={true} />
      <SourceBadge number={5} isUp={false} inactive={true} />
    </div>
  );
}
