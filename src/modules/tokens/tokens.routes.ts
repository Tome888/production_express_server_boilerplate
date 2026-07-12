import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { cacheMiddleware } from "../../middlewares/cache.js";
import { TokensController } from "./tokens.controller.js";
import {
  createUserTokenSchema,
  getUserTokenSchema,
  updateUserTokenSchema,
  deleteUserTokenSchema,
} from "./tokens.schema.js";

const router = Router();

/**
 * FETCH TOKENS BY USER ID
 * Applies performance caching layer and checks param structure
 */
router.get(
  "/:userId",
  validate(getUserTokenSchema),
  cacheMiddleware(300),
  TokensController.getTokensUser,
);

/**
 * CREATE A NEW TOKEN ENTRY FOR A USER
 * Enforces strict input body schema verification
 */
router.post(
  "/",
  validate(createUserTokenSchema),
  TokensController.createTokenUser,
);

/**
 * UPDATE USER TOKENS
 * Validates the payload body structure containing userId and token
 */
router.put(
  "/",
  validate(updateUserTokenSchema),
  TokensController.updateTokensUser,
);

/**
 * PURGE USER TOKENS FROM THE SYSTEM
 * Ensures URL tracking param conforms to strict schema parameters
 */
router.delete(
  "/:userId",
  validate(deleteUserTokenSchema),
  TokensController.deleteTokensUser,
);

export default router;
