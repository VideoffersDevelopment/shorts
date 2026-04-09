import { z } from "zod"
import { LikeType } from "@prisma/client"

/**
 * Schema for toggling a like/reaction
 */
export const likeSchema = z.object({
  type: z.nativeEnum(LikeType).default(LikeType.LIKE),
})

export type LikeInput = z.infer<typeof likeSchema>

/**
 * Schema for creating a comment
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment too long (max 500 characters)"),
  parentId: z.string().cuid("Invalid parent comment ID").optional(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

/**
 * Schema for updating a comment
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment too long (max 500 characters)"),
})

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

/**
 * Schema for comment list query params
 */
export const commentQuerySchema = z.object({
  sort: z.enum(["newest", "oldest", "most_liked"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export type CommentQueryInput = z.infer<typeof commentQuerySchema>
