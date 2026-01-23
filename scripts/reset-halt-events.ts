import { db, schema } from "../lib/db";

/**
 * Reset script to clear all halt events from the database
 * Run with: TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." npx tsx scripts/reset-halt-events.ts
 */
async function resetHaltEvents() {
  try {
    console.log("Deleting all halt events...");

    await db.delete(schema.haltEvents);

    console.log("✓ Successfully deleted all halt events");
    console.log("Database has been reset and is ready for fresh monitoring data");

    process.exit(0);
  } catch (error) {
    console.error("Error resetting halt events:", error);
    process.exit(1);
  }
}

resetHaltEvents();
