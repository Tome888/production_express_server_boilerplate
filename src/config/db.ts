import Database from "better-sqlite3";
import path from "path";
import logger from "./logger.js";

// Use standard CommonJS __dirname since our tsconfig target is CommonJS
const dbPath = path.resolve(__dirname, "../../production_simulation.db");

// Initialize SQLite with a busy timeout
const db = new Database(dbPath, {
  timeout: 5000, // Wait up to 5 seconds if the DB is locked before throwing an error
  verbose: (msg: unknown) => {
    logger.debug(String(msg));
  },
});

// Configure production database parameters (PRAGMAs)
try {
  db.pragma("journal_mode = WAL"); // Enables simultaneous multi-client reads during writes
  db.pragma("synchronous = NORMAL"); // Optimizes disk-write speed while keeping data safe
  db.pragma("cache_size = -2000"); // Allocates ~2MB of RAM to cache database pages
  db.pragma("foreign_keys = ON"); // Enforces structural integrity constraints between tables

  logger.info(
    "💾 SQLite database engine successfully initialized in WAL mode.",
  );
} catch (error) {
  logger.error("Failed to initialize database PRAGMAs:", error);
  throw error;
}

export default db;
