import { createClient } from "redis";
import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Core Exception Error:", err);
});

redisClient.on("connect", () => {
  logger.info(
    "✅ Handshake established. Connected to Redis caching cluster safely.",
  );
});

export default redisClient;
