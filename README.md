


# Enterprise Production API Core

An enterprise-grade, high-performance Node.js backend template built with **Express**, **TypeScript**, **SQLite (better-sqlite3)**, and **Redis** caching.

Designed around a domain-driven architecture with strong validation, centralized error handling, Redis-backed caching, security middleware, and graceful process shutdown.

---

## Features

* Express.js + TypeScript
* SQLite powered by better-sqlite3
* Redis caching layer
* Domain-Driven Design (DDD) architecture
* Zod request validation
* Centralized error handling
* Redis-backed rate limiting
* IP blacklist protection
* Winston logging
* Graceful shutdown handlers
* Production-ready structure

---

# Project Structure

```text
my-production-api/
├── dist/                         # Compiled JavaScript output (production only)
├── logs/                         # Automatically generated Winston log files
├── node_modules/                 # Local project dependencies
└── src/
    ├── config/                   # Global configurations & DB connections
    │   ├── db.ts                 # SQLite connection & PRAGMA configuration
    │   ├── redis.ts              # Redis client connection setup
    │   └── logger.ts             # Winston logger instance
    │
    ├── middlewares/              # Express interceptors
    │   ├── auth.ts               # Authentication guards (if needed)
    │   ├── cache.ts              # Redis caching logic
    │   ├── errorHandler.ts       # Centralized error handler catch-all
    │   ├── ipBan.ts              # Global Redis IP blacklist checker
    │   ├── rateLimiter.ts        # Redis-backed express-rate-limit config
    │   └── validate.ts           # Zod schema validation engine
    │
    ├── modules/                  # Feature-Based Modules (Domain Driven)
    │   └── items/                # Everything related to the "Items" CRUD domain
    │       ├── items.controller.ts  # Handles HTTP requests/responses
    │       ├── items.interface.ts   # TypeScript interfaces/types for items
    │       ├── items.repository.ts  # Direct SQL statements and DB queries
    │       ├── items.routes.ts      # Express route mappings for items
    │       ├── items.schema.ts      # Zod validation schemas
    │       └── items.service.ts     # Business logic, caching decisions, processing
    │
    ├── app.ts                    # Express app configuration (security, global midware)
    └── server.ts                 # App entry point (listens on port, handles shutdown)
```

---

# Running the Project

## Development Mode

Runs the application with hot reloading.

```bash
npm run dev
```

---

## Production Mode

### 1. Build

```bash
npm run build
```

### 2. Start

```bash
npm run start
```

---

# Creating a New Module

The project follows a feature-based architecture. Each domain should contain:

```text
src/modules/
└── users/
    ├── users.controller.ts
    ├── users.repository.ts
    ├── users.routes.ts
    ├── users.schema.ts
    └── users.service.ts
```

## Module Responsibilities

### Schema Layer

Defines request validation using Zod.

```ts
users.schema.ts
```

Responsible for:

* Body validation
* Params validation
* Query validation
* Type inference

---

### Repository Layer

Handles direct database interactions.

```ts
users.repository.ts
```

Responsible for:

* SQL queries
* Database schema initialization
* CRUD operations

---

### Service Layer

Contains business logic.

```ts
users.service.ts
```

Responsible for:

* Data processing
* Cache invalidation
* Service orchestration

---

### Controller Layer

Processes HTTP requests and responses.

```ts
users.controller.ts
```

Responsible for:

* Request handling
* Response formatting
* Error forwarding

---

### Routes Layer

Maps endpoints to controllers.

```ts
users.routes.ts
```

Responsible for:

* Endpoint registration
* Validation middleware
* Cache middleware
* Controller binding

---

# Example Route Registration

```ts
import { Router } from 'express';
import itemsRouter from './modules/items/items.routes.js';
import usersRouter from './modules/users/users.routes.js';

const apiRouter = Router();

apiRouter.use('/items', itemsRouter);
apiRouter.use('/users', usersRouter);

export default apiRouter;
```

---

# Architectural Guardrails

## Validation Middleware Order

Always place validation middleware before controller handlers.

✅ Correct

```ts
router.post(
  '/',
  validate(createUserSchema),
  UsersController.create
);
```

❌ Incorrect

```ts
router.post(
  '/',
  UsersController.create,
  validate(createUserSchema)
);
```

---

## Async Error Handling

All async controllers should wrap logic in `try/catch` and call `next(error)`.

```ts
try {
  // logic
} catch (error) {
  next(error);
}
```

This prevents unhandled promise rejections.

---

## Request Size Protection

The API enforces request body limits globally.

```ts
express.json({ limit: '10kb' });
```

Do not remove or override these limits unless absolutely necessary.

---

# Technology Stack

| Technology              | Purpose       |
| ----------------------- | ------------- |
| Express                 | HTTP Server   |
| TypeScript              | Type Safety   |
| SQLite (better-sqlite3) | Database      |
| Redis                   | Caching       |
| Zod                     | Validation    |
| Winston                 | Logging       |
| express-rate-limit      | Rate Limiting |

---

# Production Recommendations

* Run Redis separately from the API process
* Enable HTTPS in production
* Use environment variables for secrets
* Enable process monitoring (PM2, Docker, Kubernetes)
* Rotate Winston logs regularly
* Configure automated database backups

---

# License

MIT License
