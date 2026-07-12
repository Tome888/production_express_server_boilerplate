import { z } from "zod";

export interface TokensRepository {
  id: number;
  userId: number;
  token: number;
  createdAt: Date;
}

// Fixed: Wrapped in z.object() and added z.coerce to safely turn string inputs into numbers
export const createUserTokenSchema = z.object({
  body: z.object({
    userId: z.coerce.number().int().positive("User ID must be a positive integer"),
  })
});

export const updateUserTokenSchema = z.object({
  body: z.object({
    userId: z.coerce.number().int().positive(),
    token: z.coerce.number().min(0, "Token must be at least 0")
  })
});

export const deleteUserTokenSchema = z.object({
  params: z.object({
    userId: z.coerce.number().int().positive(),
  })
});

export const getUserTokenSchema = z.object({
  params: z.object({
    userId: z.coerce.number().int().positive(),
  }),
});

// Explicitly inferring the type of the entire request schema structure
export type CreateUserTokenInput = z.infer<typeof createUserTokenSchema>;
export type UpdateUserTokenInput = z.infer<typeof updateUserTokenSchema>;
export type DeleteUserTokenInput = z.infer<typeof deleteUserTokenSchema>;
export type GetUserTokenInput = z.infer<typeof getUserTokenSchema>;
