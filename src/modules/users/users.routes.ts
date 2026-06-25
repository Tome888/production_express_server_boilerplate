import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { cacheMiddleware } from "../../middlewares/cache.js";
import {
  createUserSchema,
  userIdParamSchema,
  updateUserSchema,
} from "./users.schema.js";

const router = Router();

/**
 * FETCH ALL ITEMS
 * Applies performance caching layer (defaults to 5 minutes ttl)
 */
router.get("/", cacheMiddleware(300), UsersController.getAll);

/**
 * FETCH SINGLE ITEM BY ID
 * Enforces numeric parameter constraints and performance caching
 */
router.get(
  "/:id",
  validate(userIdParamSchema),
  cacheMiddleware(0),
  UsersController.getById,
);

/**
 * CREATE A NEW ITEM
 * Enforces strict input body schema verification
 */
router.post("/", validate(createUserSchema), UsersController.create);

/**
 * UPDATE AN EXISTING ITEM
 * Validates both the URL tracking ID parameter and payload body structure
 */
router.put("/:id", validate(updateUserSchema), UsersController.update);

/**
 * PURGE AN ITEM FROM THE SYSTEM
 * Ensures URL ID parameter conforms to strict structural requirements
 */
router.delete("/:id", validate(userIdParamSchema), UsersController.delete);

export default router;
