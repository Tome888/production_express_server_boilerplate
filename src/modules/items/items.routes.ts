import { Router } from "express";
import { ItemsController } from "./items.controller.js";
import { validate } from "../../middlewares/validate.js";
import { cacheMiddleware } from "../../middlewares/cache.js";
import {
  createItemSchema,
  itemIdParamSchema,
  updateItemSchema,
} from "./items.schema.js";

const router = Router();

/**
 * FETCH ALL ITEMS
 * Applies performance caching layer (defaults to 5 minutes ttl)
 */
router.get("/", cacheMiddleware(300), ItemsController.getAll);

/**
 * FETCH SINGLE ITEM BY ID
 * Enforces numeric parameter constraints and performance caching
 */
router.get(
  "/:id",
  validate(itemIdParamSchema),
  cacheMiddleware(300),
  ItemsController.getById,
);

/**
 * CREATE A NEW ITEM
 * Enforces strict input body schema verification
 */
router.post("/", validate(createItemSchema), ItemsController.create);

/**
 * UPDATE AN EXISTING ITEM
 * Validates both the URL tracking ID parameter and payload body structure
 */
router.put("/:id", validate(updateItemSchema), ItemsController.update);

/**
 * PURGE AN ITEM FROM THE SYSTEM
 * Ensures URL ID parameter conforms to strict structural requirements
 */
router.delete("/:id", validate(itemIdParamSchema), ItemsController.delete);

export default router;
