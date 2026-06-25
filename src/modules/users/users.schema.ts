import { z } from "zod";

/**
 * Reusable data validation atoms for the Users domain
 */
const userPayload = z.object({
  name: z
    .string({
      message: "User name must be a valid string primitive",
    })
    .trim()
    .min(1, "User name cannot be an empty string")
    .max(
      100,
      "User name cannot exceed 100 characters to prevent buffer strain",
    ),

  lastName: z
    .string({
      message: "User lastName must be a valid string primitive",
    })
    .trim()
    .min(1, "User lastName cannot be an empty string")
    .max(
      100,
      "User lastName cannot exceed 100 characters to prevent buffer strain",
    ),

  user_email: z
    .string({
      message: "User email must be a valid string primitive",
    })
    .trim()
    .min(1, "User email cannot be an empty string")
    .email(
      "Provided user_email must adhere to valid structural email specifications",
    )
    .max(
      100,
      "User email cannot exceed 100 characters to prevent buffer strain",
    ),

  phone_number: z
    .string({
      message: "User phone_number must be a valid string primitive",
    })
    .trim()
    .min(1, "User phone_number cannot be an empty string")
    .max(
      100,
      "User phone_number cannot exceed 100 characters to prevent buffer strain",
    ),

  age: z
    .number({
      message: "User age must be a valid number primitive",
    })
    .min(0, "User age cannot be a negative number")
    .max(120, "User age cannot exceed 120 years to prevent unrealistic values"),
});

/**
 * 1. Schema for POST /users (Creation)
 */
export const createUserSchema = z.object({
  body: userPayload,
  query: z.object({}).catchall(z.unknown()).optional(),
  params: z.object({}).catchall(z.unknown()).optional(),
});

/**
 * 2. Schema for GET /users/:id or DELETE /users/:id (Resource Targeted)
 */
export const userIdParamSchema = z.object({
  body: z.unknown(),
  query: z.object({}).catchall(z.unknown()).optional(),
  params: z.object({
    id: z
      .string()
      .regex(
        /^\d+$/,
        "Target user resource identifier must be a valid numeric string sequence",
      ),
  }),
});

/**
 * 3. Schema for PUT /users/:id (Full Update)
 */
export const updateUserSchema = z.object({
  body: userPayload,
  query: z.object({}).catchall(z.unknown()).optional(),
  params: z.object({
    id: z
      .string()
      .regex(
        /^\d+$/,
        "Target user resource identifier must be a valid numeric string sequence",
      ),
  }),
});

// Infer strict TypeScript compiler contracts directly from our operational Zod schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
