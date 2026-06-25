import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

/**
 * Global Firewall Middleware
 * Intercepts incoming requests and validates client IP against the Redis blacklist.
 */
export const ipBanMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Extract client IP safely (Requires app.set('trust proxy', 1) to be configured in app.ts)
  const clientIp = req.ip || req.socket.remoteAddress || "";

  try {
    // Query Redis Set asynchronously to check if the IP exists in the blacklist
    const isBanned = await redisClient.sIsMember("banned_ips", clientIp);

    if (isBanned) {
      logger.warn(
        `[SECURITY VIOLATION]: Blocked request from blacklisted IP: ${clientIp} trying to access: ${req.originalUrl}`,
      );

      res.status(403).json({
        error: "Access Denied",
        message:
          "Your IP address has been permanently blacklisted by network security controllers.",
      });
      return;
    }
  } catch (error) {
    // Fail-Safe Principle: If Redis goes down, log the error and allow the traffic through
    // so your entire production app doesn't crash for legitimate clients.
    logger.error(
      `Failed to execute IP blacklist validation query on Redis cluster:`,
      error,
    );
  }

  // IP is clean, pass control to the next middleware or controller
  next();
};
