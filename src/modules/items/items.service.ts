import { ItemsRepository, Item } from "./items.repository.js";
import redisClient from "../../config/redis.js";
import logger from "../../config/logger.js";

export const ItemsService = {
  /**
   * Retrieves all items from the database layer
   */
  async getAllItems(): Promise<Item[]> {
    return ItemsRepository.findAll();
  },

  /**
   * Retrieves a single item record by ID
   */
  async getItemById(id: number): Promise<Item | null> {
    return ItemsRepository.findById(id);
  },

  /**
   * Creates a new item and clears the general collection cache
   */
  async createItem(name: string, price: number): Promise<Item> {
    const newItem = ItemsRepository.create(name, price);

    // Evict stale collection cache arrays to maintain real-time sync accuracy
    this.evictCacheByPattern("cache:/items*");

    return newItem;
  },

  /**
   * Updates an item and clears out both collection and item-specific cache layouts
   */
  async updateItem(
    id: number,
    name: string,
    price: number,
  ): Promise<Item | null> {
    const updatedItem = ItemsRepository.update(id, name, price);

    if (updatedItem) {
      // Clear specific cache strings to enforce immediate cache synchronization
      this.evictCacheByPattern(`cache:/items/${id}`);
      this.evictCacheByPattern("cache:/items*");
    }

    return updatedItem;
  },

  /**
   * Purges an item from the system and triggers cache evictions
   */
  async deleteItem(id: number): Promise<boolean> {
    const isDeleted = ItemsRepository.delete(id);

    if (isDeleted) {
      this.evictCacheByPattern(`cache:/items/${id}`);
      this.evictCacheByPattern("cache:/items*");
    }

    return isDeleted;
  },

  /**
   * Background cache purger utilizing asynchronous execution paths
   */
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
