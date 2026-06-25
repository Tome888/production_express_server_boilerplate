import app from "./app.js";
import logger from "./config/logger.js";
import db from "./config/db.js";
import redisClient from "./config/redis.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * Enterprise Application Bootstrap Routine
 * Ensures stateful services are completely connected BEFORE opening network sockets.
 */
async function bootstrap() {
  try {
    // 1. Establish handshake with Redis Caching Cluster
    if (!redisClient.isOpen) {
      logger.info("🔄 Connecting to Redis cache infrastructure...");
      await redisClient.connect();
      logger.info("✅ Redis cache client successfully pooled and operational.");
    }

    // 2. Spin up the network listener engine only after database/cache channels are verified
    const server = app.listen(PORT, () => {
      logger.info(
        `🚀 System operational matrix online. Server listening on port ${PORT}`,
      );
    });

    // Handle Graceful Shutdown Routine
    const handleGracefulShutdown = (signal: string) => {
      logger.warn(
        `[SHUTDOWN SIGNAL]: Received ${signal}. Initializing orderly infrastructure draining...`,
      );

      server.close(async (err) => {
        if (err) {
          logger.error(
            "Error occurred while closing network listener socket:",
            err,
          );
          process.exit(1);
        }
        logger.info(
          "🛑 Network listener socket closed. Active client requests drained.",
        );

        try {
          if (redisClient.isOpen) {
            await redisClient.quit();
            logger.info("🛑 Redis client connection terminated cleanly.");
          }
        } catch (redisError) {
          logger.error(
            "Error encountered while disconnecting Redis socket:",
            redisError,
          );
        }

        try {
          db.close();
          logger.info("🛑 SQLite local database connections safely closed.");
        } catch (dbError) {
          logger.error(
            "Error encountered while closing SQLite database engine:",
            dbError,
          );
        }

        logger.info(
          "👋 Infrastructure teardown complete. Process exiting cleanly.",
        );
        process.exit(0);
      });

      setTimeout(() => {
        logger.error(
          "CRITICAL TIMEOUT: Forcefully terminating process. Core resources failed to drain within window.",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("FATAL SYSTEM BOOTSTRAP FAILURE:", error);
    process.exit(1);
  }
}

// Start the server bootstrap sequence
bootstrap();

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    "CRITICAL UNHANDLED PROMISE REJECTION DETECTED AT:",
    promise,
    "REASON:",
    reason,
  );
});

process.on("uncaughtException", (error) => {
  logger.error("FATAL UNCAUGHT EXCEPTION CRASHED THREAD:", error);
  process.exit(1);
});
