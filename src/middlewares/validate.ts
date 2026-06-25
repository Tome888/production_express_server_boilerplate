import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * Universal Validation Interceptor Middleware
 * Validates incoming client request components against a pre-compiled Zod schema.
 * Re-assigns validated and transformed data back safely without overwriting read-only object wrappers.
 * @param schema The schema constraint container to validate against
 */
export const validate = (schema: ZodObject<any, any>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Execute multi-segment data validation
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      /**
       * SAFE RESOURCE MUTATION WITH FALLBACKS
       * We append logical OR (|| {}) structures. If Zod outputs an optional segment
       * as undefined, we merge an empty object literal instead of passing undefined
       * to Object.assign, preventing fatal TypeErrors.
       */
      Object.assign(req.body || {}, parsed.body || {});
      Object.assign(req.query || {}, parsed.query || {});
      Object.assign(req.params || {}, parsed.params || {});

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Intercept data structural failures and reject with a clean 400 Bad Request
        res.status(400).json({
          error: "Bad Request",
          message:
            "The submitted request payload failed strict structural schema constraints.",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            issue: issue.message,
          })),
        });
        return;
      }

      // Bubble unexpected infrastructure exceptions down to the centralized error catcher
      return next(error);
    }
  };
};
