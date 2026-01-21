import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const chains = sqliteTable("chains", {
  id: text("id").primaryKey(), // e.g., "ethereum", "bitcoin"
  name: text("name").notNull(),
  expectedBlockTime: integer("expected_block_time").notNull(), // in seconds
  haltThreshold: integer("halt_threshold").notNull(), // in seconds
  rpcUrl: text("rpc_url"),
  explorerApiUrl: text("explorer_api_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const blockSnapshots = sqliteTable("block_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chainId: text("chain_id")
    .notNull()
    .references(() => chains.id),
  blockNumber: integer("block_number").notNull(),
  blockTimestamp: integer("block_timestamp").notNull(), // unix timestamp
  source: text("source").notNull(), // "primary", "secondary", or "tertiary"
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const haltEvents = sqliteTable("halt_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chainId: text("chain_id")
    .notNull()
    .references(() => chains.id),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  durationSeconds: integer("duration_seconds"),
  severity: text("severity").notNull(), // "slow", "halted"
});

export const chainStatus = sqliteTable("chain_status", {
  chainId: text("chain_id")
    .primaryKey()
    .references(() => chains.id),
  status: text("status").notNull(), // "healthy", "slow", "halted", "degraded", "stale", "unknown"
  latestBlockNumber: integer("latest_block_number"),
  latestBlockTimestamp: integer("latest_block_timestamp"),
  primarySourceStatus: text("primary_source_status"), // "up", "down"
  secondarySourceStatus: text("secondary_source_status"), // "up", "down"
  tertiarySourceStatus: text("tertiary_source_status"), // "up", "down"
  uptimePercent24h: real("uptime_percent_24h"),
  uptimePercent7d: real("uptime_percent_7d"),
  uptimePercent30d: real("uptime_percent_30d"),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Chain = typeof chains.$inferSelect;
export type NewChain = typeof chains.$inferInsert;
export type BlockSnapshot = typeof blockSnapshots.$inferSelect;
export type NewBlockSnapshot = typeof blockSnapshots.$inferInsert;
export type HaltEvent = typeof haltEvents.$inferSelect;
export type NewHaltEvent = typeof haltEvents.$inferInsert;
export type ChainStatusRecord = typeof chainStatus.$inferSelect;
export type NewChainStatusRecord = typeof chainStatus.$inferInsert;
