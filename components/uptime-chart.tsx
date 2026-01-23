"use client";

interface HaltEvent {
  id: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  severity: string;
}

interface UptimeChartProps {
  haltEvents: HaltEvent[];
  periodDays?: number;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Ongoing";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UptimeChart({ haltEvents, periodDays = 30 }: UptimeChartProps) {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Filter events within the period
  const relevantEvents = haltEvents.filter((e) => {
    const eventEnd = e.endedAt ? new Date(e.endedAt) : now;
    return eventEnd >= periodStart;
  });

  // Create 30 blocks representing each day
  const blocks = Array.from({ length: 30 }, (_, i) => {
    const dayStart = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Check if any events occurred during this day
    let status: "healthy" | "slow" | "halted" = "healthy";

    for (const event of relevantEvents) {
      const eventStart = new Date(event.startedAt);
      const eventEnd = event.endedAt ? new Date(event.endedAt) : now;

      // Check if event overlaps with this day
      if (eventStart < dayEnd && eventEnd > dayStart) {
        // Prioritize halted over slow
        if (event.severity === "halted") {
          status = "halted";
          break; // Halted is highest priority, stop checking
        } else if (event.severity === "slow") {
          status = "slow";
        }
      }
    }

    return {
      date: dayStart,
      status,
    };
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">
        Uptime History ({periodDays} days)
      </h3>

      {/* 30 Day Blocks */}
      <div className="flex gap-1.5 mb-6 flex-wrap sm:flex-nowrap">
        {blocks.map((block, i) => {
          const bgColor =
            block.status === "halted"
              ? "bg-red-500"
              : block.status === "slow"
              ? "bg-yellow-500"
              : "bg-green-500";

          const dateStr = block.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={i}
              className={`flex-1 min-w-[8px] h-12 ${bgColor} rounded-sm transition-all hover:opacity-80 cursor-pointer`}
              title={`${dateStr}: ${block.status}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/30 rounded" />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded" />
          <span>Slow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Halted</span>
        </div>
      </div>

      {/* Event list */}
      {relevantEvents.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Recent Incidents</h4>
          {relevantEvents.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between text-sm bg-gray-800 rounded px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    event.severity === "halted" ? "bg-red-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-gray-300">
                  {event.severity === "halted" ? "Chain Halted" : "Chain Slow"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <span>{formatDate(event.startedAt)}</span>
                <span className="font-mono">
                  {formatDuration(event.durationSeconds)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No incidents in this period</p>
      )}
    </div>
  );
}
