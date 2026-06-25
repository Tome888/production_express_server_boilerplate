import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";

/**
 * Global Centralized Error Interceptor
 * Catches all runtime errors thrown by routers, controllers, or database layers.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  // Log the complete error stack trace securely inside your Winston file engine
  logger.error(`[UNHANDLED EXCEPTION]: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack,
  });

  // Check if the error is a known structural validation error (like Zod)
  if (err.name === "ZodError") {
    res.status(400).json({
      error: "Bad Request",
      message:
        "The submitted request payload failed strict system validation schemas.",
      details: JSON.parse(err.message),
    });
    return;
  }

  // Handle all other unexpected system or database failures
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected technical issue occurred on our core systems.",
    // Only reveal structural error details if developing locally
    ...(isProduction
      ? {}
      : { debug_stack: err.stack, debug_message: err.message }),
  });
};
