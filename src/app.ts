import express from "express";
import helmet from "helmet";
import cors from "cors";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";
import { ipBanMiddleware } from "./middlewares/ipBan.js"; // FIXED IMPORT NAME HERE
import { errorHandler } from "./middlewares/errorHandler.js";
import apiRouter from "./routes.js";
import logger from "./config/logger.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
const app = express();

/**
 * Configure Express Engine Settings
 * CRITICAL FOR IP LOGGING: This enables Express to trust proxy headers (X-Forwarded-For)
 * passed by upstream load balancers (NGINX, Cloudflare, AWS ALB) so req.ip reads the true client IP.
 */
app.set("trust proxy", 1);

/**
 * 1. PRIMARY SYSTEM INFRASTRUCTURE SECURITY FIREWALLS
 * These middlewares execute immediately to discard malicious packets before parsing bodies.
 */

// Protect headers against common exploit vectors using Helmet
app.use(helmet());

// Configure Cross-Origin Resource Sharing for strict domain containment
app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Apply your real-time IP blacklisting check (FIXED METHOD CALL HERE)
app.use(ipBanMiddleware);

// Apply your cluster-synchronized rate limiter
app.use("/api/", globalRateLimiter);

/**
 * 2. STRUCTURAL REQUEST INGESTION PARSERS
 */

// Limit JSON payload body size to prevent memory exhaustion (DoS) attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/**
 * 3. ROUTE MANAGEMENT GATEWAYS
 */

// Mount all versioned system routes under the /api/v1 namespace
app.use("/api/v1", apiRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Fallback catch-all middleware for handling unmapped endpoints (404)
app.use((req, res) => {
  logger.warn(
    `[UNMAPPED ROUTE ACCESS]: Client tried to reach non-existent resource path: ${req.originalUrl}`,
  );
  res.status(404).json({
    error: "Not Found",
    message:
      "The requested resource endpoint does not exist on this system core.",
  });
});

/**
 * 4. SYSTEM-WIDE ERROR BOUNDARY DEFENSE VALVE
 * CRITICAL: This must remain positioned dead-last in the execution stack.
 */
app.use(errorHandler);

export default app;
