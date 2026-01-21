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
  const totalMs = periodDays * 24 * 60 * 60 * 1000;

  // Filter events within the period
  const relevantEvents = haltEvents.filter((e) => {
    const eventEnd = e.endedAt ? new Date(e.endedAt) : now;
    return eventEnd >= periodStart;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Uptime History ({periodDays} days)
      </h3>

      {/* Visual timeline */}
      <div className="relative h-8 bg-green-900/30 rounded overflow-hidden mb-4">
        {relevantEvents.map((event) => {
          const eventStart = new Date(event.startedAt);
          const eventEnd = event.endedAt ? new Date(event.endedAt) : now;

          // Calculate position and width as percentage
          const startOffset = Math.max(
            0,
            (eventStart.getTime() - periodStart.getTime()) / totalMs
          );
          const endOffset = Math.min(
            1,
            (eventEnd.getTime() - periodStart.getTime()) / totalMs
          );
          const width = endOffset - startOffset;

          if (width <= 0) return null;

          const bgColor =
            event.severity === "halted" ? "bg-red-500" : "bg-yellow-500";

          return (
            <div
              key={event.id}
              className={`absolute top-0 bottom-0 ${bgColor} opacity-80`}
              style={{
                left: `${startOffset * 100}%`,
                width: `${width * 100}%`,
              }}
              title={`${event.severity}: ${formatDate(event.startedAt)}`}
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
