import { Router } from "express";
import itemsRouter from "./modules/items/items.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import tokensRouter from "./modules/tokens/tokens.routes.js";

const apiRouter = Router();

// Health Check Endpoint
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.use("/items", itemsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/tokens", tokensRouter);


export default apiRouter;
