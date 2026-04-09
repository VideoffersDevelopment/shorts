import { z } from "zod"

/**
 * Schema for creating a new short video
 */
export const createShortSchema = z.object({
  rawVideoKey: z.string().min(1, "Video key is required"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  categoryId: z.string().cuid("Invalid category"),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500, "Address too long").optional(),
  ctaLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  customThumbnail: z.boolean().optional(),
  duration: z.number().int().positive().max(60, "Duration exceeds 60 seconds").optional(),
  aspectRatio: z.string().optional()
})

export type CreateShortInput = z.infer<typeof createShortSchema>

/**
 * Schema for updating short metadata
 */
export const updateShortSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  ctaLink: z.string().url("Invalid URL").optional().nullable().or(z.literal(""))
})

export type UpdateShortInput = z.infer<typeof updateShortSchema>

/**
 * Schema for short ID parameter
 */
export const shortIdSchema = z.object({
  shortId: z.string().cuid("Invalid short ID")
})

export type ShortIdInput = z.infer<typeof shortIdSchema>
