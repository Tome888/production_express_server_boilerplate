import { Request, Response, NextFunction } from "express";
import { autoBanIP } from "./ipBan.js";
import logger from "../config/logger.js";

// List of URL patterns that only hackers/bots would look for
const EXPLOIT_TARGET_PATHS = [
  "/wp-admin",
  "/.env",
  "/config.json",
  "/.git",
  "/xmlrpc.php",
  "/phpmyadmin",
];

/**
 * Honeypot Middleware
 * Instantly bans any client trying to search for configuration files or admin panels.
 */
export const honeypotMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let clientIp = req.ip || req.socket.remoteAddress || "";
  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }

  const requestedPath = req.originalUrl.toLowerCase();

  // Check if the requested path matches any exploit targets
  const isMaliciousTarget = EXPLOIT_TARGET_PATHS.some((path) =>
    requestedPath.includes(path),
  );

  if (isMaliciousTarget) {
    logger.warn(
      `[HONEYPOT TRIGGERED]: Malicious scan detected from IP ${clientIp} on path: ${req.originalUrl}`,
    );

    // Dynamically determine to ban this IP right now!
    await autoBanIP(
      clientIp,
      `Exploit scanning targeted at: ${req.originalUrl}`,
    );

    res.status(403).json({
      error: "Security Violation",
      message:
        "Malicious activity detected. Your IP has been flagged and banned.",
    });
    return;
  }

  next();
};
