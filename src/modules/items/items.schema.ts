import { z } from "zod";

/**
 * Reusable data validation atoms for the Items domain
 */
const itemPayload = z.object({
  name: z
    .string({
      message: "Item name must be a valid string primitive",
    })
    .trim()
    .min(1, "Item name cannot be an empty string")
    .max(
      100,
      "Item name cannot exceed 100 characters to prevent buffer strain",
    ),

  price: z
    .number({
      message: "Item price must be a valid numeric primitive",
    })
    .positive(
      "Item price must be a strictly positive numerical value greater than zero",
    )
    .max(
      1000000,
      "Item price cannot exceed 1,000,000 for systemic asset protection",
    ),
});

/**
 * 1. Schema for POST /items (Creation)
 */
export const createItemSchema = z.object({
  body: itemPayload,
  query: z.object({}).catchall(z.unknown()),
  params: z.object({}).catchall(z.unknown()),
});

/**
 * 2. Schema for GET /items/:id or DELETE /items/:id (Resource Targeted)
 */
export const itemIdParamSchema = z.object({
  body: z.object({}).catchall(z.unknown()),
  query: z.object({}).catchall(z.unknown()),
  params: z.object({
    id: z
      .string()
      .regex(
        /^\d+$/,
        "Target item resource identifier must be a valid numeric string sequence",
      )
      .transform((val) => Number(val)),
  }),
});

/**
 * 3. Schema for PUT /items/:id (Full Update)
 */
export const updateItemSchema = z.object({
  body: itemPayload,
  query: z.object({}).catchall(z.unknown()),
  params: z.object({
    id: z
      .string()
      .regex(
        /^\d+$/,
        "Target item resource identifier must be a valid numeric string sequence",
      )
      .transform((val) => Number(val)),
  }),
});

// Infer strict TypeScript compiler contracts directly from our operational Zod schemas
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type ItemIdParamInput = z.infer<typeof itemIdParamSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
