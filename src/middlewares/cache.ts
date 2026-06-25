import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

/**
 * Cache Interceptor Middleware
 * @param ttl Time-to-Live in seconds for the cached data (defaults to 5 minutes)
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Only intercept safe read operations
    if (req.method !== "GET" || ttl <= 0) {
      return next();
    }

    // Use the request URL as the unique cache key identifier
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        logger.debug(
          `[CACHE HIT]: Serving payload instantly from Redis for key: ${cacheKey}`,
        );

        // Return cached payload directly to client and terminate request execution cycle
        res.status(200).json(JSON.parse(cachedResponse));
        return;
      }

      logger.debug(
        `[CACHE MISS]: Forwarding request to database for key: ${cacheKey}`,
      );

      // High-Jack the res.json method temporarily to intercept the database payload before it goes out
      const originalJsonMethod = res.json;

      res.json = function (body): Response {
        // Restore original functionality immediately
        res.json = originalJsonMethod;

        // Save response asynchronously to Redis before sending it back to the client
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient
            .setEx(cacheKey, ttl, JSON.stringify(body))
            .catch((err) =>
              logger.error(
                `Failed to commit payload cache to Redis setEx:`,
                err,
              ),
            );
        }

        // Complete the original HTTP payload delivery
        return originalJsonMethod.call(this, body);
      };

      next();
    } catch (error) {
      logger.error(`Critical caching interceptor operational failure:`, error);
      // Fail-safe: If Redis caching queries crash, fallback gracefully to database execution stream
      next();
    }
  };
};
