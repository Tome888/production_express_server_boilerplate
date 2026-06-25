import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

/**
 * Configure a cluster-safe Redis-backed rate limiter.
 * This stores hit-counters centrally so multiple server instances share the same state.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes allocation window
  max: 100, // Limit each client IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the old `X-RateLimit-*` headers

  // Custom Redis store adapter configuration
  store: new RedisStore({
    // Send commands using a wrapper that ensures we don't call a closed client
    sendCommand: async (...args: string[]) => {
      // CRITICAL FALLBACK SAFEGUARD
      if (!redisClient.isOpen) {
        logger.warn(
          "[RATE LIMITER]: Redis client was closed during execution. Attempting emergency connection...",
        );
        await redisClient.connect().catch((err) => {
          logger.error(
            "[RATE LIMITER CRITICAL]: Emergency Redis reconnection failed:",
            err,
          );
        });
      }

      // Execute command on Redis
      return redisClient.sendCommand(args);
    },
  }),

  handler: (req, res) => {
    logger.warn(
      `[RATE LIMIT VIOLATION]: Client ${req.ip} exceeded structural load limits on path: ${req.originalUrl}`,
    );
    res.status(429).json({
      error: "Too Many Requests",
      message:
        "System resource thresholds breached. Please hold request velocity for 15 minutes.",
    });
  },
});
