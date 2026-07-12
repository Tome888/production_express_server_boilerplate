import { NextFunction, Request, Response } from "express";
import logger from "../../config/logger";
import { tokensRepository } from "./tokens.repository";
import redisClient from "../../config/redis";

export const TokensController = {

  createTokenUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Data is pre-validated and coerced by the validate middleware
      const { userId } = req.body;

      const userToken = await tokensRepository.createUserTokens(userId);

      // Wipe out any stale read caches for this user block
      TokensController.evictCacheByPattern(`cache:/tokens:${userId}`);
      return res.status(201).json(userToken);
    } catch (error) {
      next(error);
    }
  },

  getTokensUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parameters are pre-validated and coerced into expected types by the middleware
      const { userId } = req.params;


      const token = await tokensRepository.getTokensByUserId(Number(userId));



      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  },

  updateTokensUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Body properties are parsed and available cleanly on req.body
      const { userId, token } = req.body;

      const updatedToken = await tokensRepository.updateUserTokens(userId, token);

      // Evict the stale cache for this user right away so the next read sees updates
      TokensController.evictCacheByPattern(`cache:/tokens:${userId}`);
      return res.status(200).json(updatedToken);
    } catch (error) {
      next(error);
    }
  },

  deleteTokensUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extracted directly from req.body or req.params depending on your routing configurations
      const { userId } = req.params;

      await tokensRepository.deleteUserTokens(Number(userId));

      // Evict cache entries so data integrity matches database states
      TokensController.evictCacheByPattern(`cache:/tokens:${userId}`);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  evictCacheByPattern(pattern: string): void {
    // Fire-and-forget style tracking so database actions are never delayed by cache clearing loops
    (async () => {
      try {
        if (pattern.endsWith("*")) {
          // Initialize the cursor explicitly as a string primitive to comply with Node-Redis contracts
          let cursor = "0";
          do {
            const reply = await redisClient.scan(cursor, {
              MATCH: pattern,
              COUNT: 100,
            });
            cursor = reply.cursor;
            const keys = reply.keys;

            if (keys.length > 0) {
              await redisClient.del(keys);
              logger.debug(
                `[CACHE EVICTION]: Successfully purged keys: ${keys.join(", ")}`,
              );
            }
          } while (cursor !== "0");
        } else {
          const removed = await redisClient.del(pattern);
          if (removed > 0) {
            logger.debug(
              `[CACHE EVICTION]: Successfully purged exact key: ${pattern}`,
            );
          }
        }
      } catch (error) {
        logger.error(
          `[CACHE ERROR]: Failed to execute asynchronous eviction for pattern: ${pattern}`,
          error,
        );
      }
    })();
  },

};
