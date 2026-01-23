"use client";

import Link from "next/link";
import { CHAIN_CONFIGS, getChainAdapter } from "@/lib/chains";
import { StatusIndicator } from "@/components/status-indicator";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-2 transition-colors"
        >
          <span>&larr;</span>
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Methodology
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-3xl">
            L1Beat employs a triple-source verification system to monitor blockchain uptime with high reliability. This page documents our data collection strategy, status determination algorithm, and cross-validation logic.
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Overview</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              L1Beat continuously monitors Layer 1 blockchain networks to detect halts, slowdowns, and service degradation. Our monitoring infrastructure prioritizes accuracy through redundancy, using three independent data sources per chain to avoid false positives from single-source failures.
            </p>
            <p className="font-medium text-white">
              Architecture Flow:
            </p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
              Polling (10s interval) → Fetch from 3 sources → Cross-validate → Store → Display
            </div>
            <p>
              This approach ensures that transient issues with individual RPC nodes or APIs do not trigger false alarms, while genuine network problems are detected across multiple independent sources.
            </p>
          </div>
        </section>

        {/* Section 2: Data Collection Strategy */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Data Collection Strategy</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              Every <strong className="text-white">minute</strong>, L1Beat polls all monitored chains simultaneously. For each chain, we fetch the latest block data from three independent sources in parallel:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Primary RPC</strong>: Direct RPC endpoint specific to the chain</li>
              <li><strong className="text-white">Secondary Block Explorer</strong>: Public block explorer API (e.g., Etherscan, Blockchain.com)</li>
              <li><strong className="text-white">Tertiary API</strong>: Alternative data provider or secondary RPC</li>
            </ul>
            <p>
              Using three sources provides:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Redundancy</strong>: Service continues if one source fails</li>
              <li><strong className="text-white">Consensus</strong>: Majority voting reduces false positives</li>
              <li><strong className="text-white">Fault tolerance</strong>: Distinguishes network halts from API downtime</li>
            </ul>
            <p>
              All three sources are queried in parallel to minimize latency. The highest block number across all successful responses is used to determine the chain's current state.
            </p>
          </div>
        </section>

        {/* Section 3: Status Determination Algorithm */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Status Determination Algorithm</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              Chain status is determined by comparing the time since the last block against expected block time thresholds. The core algorithm:
            </p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto">
              <pre className="font-mono text-sm text-gray-300">
{`function determineStatusFromBlockTime(
  timeSinceLastBlock: number,
  expectedBlockTime: number
): ChainStatusType {
  // Healthy: time since last block < expectedBlockTime * 5
  if (timeSinceLastBlock < expectedBlockTime * 5) {
    return "healthy";
  }
  // Slow: time since last block < expectedBlockTime * 15
  if (timeSinceLastBlock < expectedBlockTime * 15) {
    return "slow";
  }
  // Halted: time since last block >= expectedBlockTime * 15
  return "halted";
}`}
              </pre>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-white pt-4">Status Definitions</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="healthy" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Healthy</div>
                  <div className="text-sm">Time since last block &lt; 5× expected block time (normal operation)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="slow" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Slow</div>
                  <div className="text-sm">Time since last block &lt; 15× expected block time (delayed but producing)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="halted" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Halted</div>
                  <div className="text-sm">Time since last block ≥ 15× expected block time (extended downtime)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="degraded" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Degraded</div>
                  <div className="text-sm">Healthy operation but missing 1-2 data sources</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="stale" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Stale</div>
                  <div className="text-sm">All 3 data sources unavailable</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <StatusIndicator status="unknown" size="sm" />
                </div>
                <div>
                  <div className="font-semibold text-white">Unknown</div>
                  <div className="text-sm">No data available yet (initial state)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Cross-Validation Logic */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Cross-Validation Logic</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              After fetching data from all three sources, we apply consensus logic to determine the final status. This prevents false positives from temporary API failures.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white pt-2">Source Agreement Scenarios</h3>

            <div className="space-y-4">
              <div>
                <div className="font-semibold text-white mb-1">3 sources up:</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>If all agree: Use consensus status</li>
                  <li>If 2 agree: Use majority status</li>
                  <li>If all disagree: Use most pessimistic status (safety mechanism)</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white mb-1">2 sources up:</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>If both agree: Use consensus (mark degraded if healthy)</li>
                  <li>If disagree: Trust source with highest block number</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white mb-1">1 source up:</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Trust it but mark as degraded if healthy</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white mb-1">0 sources up:</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Mark as stale (cannot determine chain status)</li>
                </ul>
              </div>
            </div>

            <p className="pt-2">
              <strong className="text-white">Pessimistic Bias:</strong> When sources disagree and no majority exists, we choose the most pessimistic status to err on the side of caution. The priority order is: halted &gt; slow &gt; degraded &gt; healthy.
            </p>

            <p>
              <strong className="text-white">Highest Block Number Rule:</strong> When sources report different block numbers, we trust the highest one, as it represents the most recent known state of the chain. This prevents stale data from one source causing false halt detections.
            </p>
          </div>
        </section>

        {/* Section 5: Uptime Calculation */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Uptime Calculation</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              Uptime percentage is calculated as the proportion of time a chain was operational (not halted) within a given period.
            </p>

            <div className="bg-gray-800 border border-gray-700 rounded p-4 text-green-400 font-mono text-center">
              uptime% = ((totalSeconds - downtimeSeconds) / totalSeconds) × 100
            </div>

            <p className="pt-2">
              <strong className="text-white">Critical Detail:</strong> Only the <span className="text-red-400 font-semibold">"halted"</span> status counts as downtime. The <span className="text-yellow-400 font-semibold">"slow"</span> status does NOT reduce uptime percentage, as the chain is still producing blocks.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white pt-2">Time Periods</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">24h:</strong> Rolling 24-hour window</li>
              <li><strong className="text-white">7d:</strong> Rolling 7-day window</li>
              <li><strong className="text-white">30d:</strong> Rolling 30-day window</li>
            </ul>

            <p>
              All periods are calculated on a rolling basis, updating with each poll. Degraded and stale statuses do not affect uptime calculations, as they indicate data source issues rather than chain halts.
            </p>
          </div>
        </section>

        {/* Section 6: Chain-Specific Configurations */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Chain-Specific Configurations</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              Each blockchain has unique characteristics that require tailored monitoring thresholds. The table below shows expected block times and derived thresholds for all monitored chains.
            </p>

            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-400">Chain</th>
                      <th className="px-4 py-3 font-medium text-gray-400 text-right">Block Time</th>
                      <th className="px-4 py-3 font-medium text-gray-400 text-right">Healthy (&lt;)</th>
                      <th className="px-4 py-3 font-medium text-gray-400 text-right">Halt (≥)</th>
                      <th className="px-4 py-3 font-medium text-gray-400">Primary</th>
                      <th className="px-4 py-3 font-medium text-gray-400">Secondary</th>
                      <th className="px-4 py-3 font-medium text-gray-400">Tertiary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHAIN_CONFIGS.map((config) => {
                      const adapter = getChainAdapter(config.id);
                      return (
                        <tr key={config.id} className="border-b border-gray-800/50">
                          <td className="px-4 py-3 text-white font-medium">{config.name}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-300">
                            {config.expectedBlockTime}s
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-green-400">
                            {config.expectedBlockTime * 5}s
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-red-400">
                            {config.haltThreshold}s
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[120px]">
                            {adapter?.primarySourceName || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[120px]">
                            {adapter?.secondarySourceName || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[120px]">
                            {adapter?.tertiarySourceName || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-sm pt-4">
              Note: The "Healthy" threshold is 5× expected block time, while "Halt" threshold is typically 15× (or custom per chain). Time between these values marks the chain as "Slow".
            </p>
          </div>
        </section>

        {/* Section 7: Limitations & Assumptions */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">Limitations &amp; Assumptions</h2>
          <div className="text-gray-400 leading-relaxed space-y-3">
            <p className="mb-4">
              While L1Beat provides reliable uptime monitoring, users should be aware of the following constraints and design decisions:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-white">Depends on RPC availability:</strong> Cannot detect consensus-level issues if all three data sources are down simultaneously
              </li>
              <li>
                <strong className="text-white">Conservative thresholds:</strong> Designed to avoid false positives using 5× and 15× multipliers, which may delay detection of gradual slowdowns
              </li>
              <li>
                <strong className="text-white">"Slow" treated as operational:</strong> Allows for normal network variance; chains producing blocks slowly are not counted as downtime
              </li>
              <li>
                <strong className="text-white">Monitors liveness only:</strong> Does not track transaction finality, network security, or consensus health beyond block production
              </li>
              <li>
                <strong className="text-white">1-minute granularity:</strong> Incidents shorter than the polling interval may be missed or imprecisely timed
              </li>
              <li>
                <strong className="text-white">Block timestamps:</strong> Relies on block timestamps which can have variance and are set by validators/miners
              </li>
              <li>
                <strong className="text-white">No distinction between planned and unplanned downtime:</strong> Scheduled upgrades are counted the same as unexpected halts
              </li>
              <li>
                <strong className="text-white">Source selection:</strong> Assumes chosen data sources are representative and independent; correlated failures could affect accuracy
              </li>
            </ul>
          </div>
        </section>

        {/* Section 8: System Architecture */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold mb-4">System Architecture</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              L1Beat is built with a modern, performant stack designed for real-time monitoring:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white pt-2">Technology Stack</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Frontend:</strong> Next.js 15, React, Tailwind CSS v4</li>
              <li><strong className="text-white">Database:</strong> Turso SQLite (distributed edge database)</li>
              <li><strong className="text-white">Polling:</strong> External cron service (cron-job.org) triggering <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm">/api/internal/poll</code> every minute</li>
              <li><strong className="text-white">Real-time Updates:</strong> SWR (stale-while-revalidate) with 1-minute auto-refresh</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white pt-4">Data Flow</h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
              Frontend (SWR) → API routes → Database → Response
            </div>
            <p className="text-sm">
              The frontend uses SWR for efficient data fetching with automatic revalidation. API routes query the Turso database and return cached results when possible. The polling service writes block snapshots, halt events, and chain status updates to the database every minute.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white pt-4">Storage Schema</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li><strong className="text-white">block_snapshots:</strong> Timestamped records of block numbers from each source</li>
              <li><strong className="text-white">halt_events:</strong> Start and end times of detected halt/slow periods</li>
              <li><strong className="text-white">chain_statuses:</strong> Current status and metadata for each monitored chain</li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
