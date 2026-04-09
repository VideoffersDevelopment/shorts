import { z } from "zod"
import { Role } from "@prisma/client"

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one ID required"),
})

export const bulkRejectSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one ID required"),
  reason: z.string().min(1, "Reason is required").max(500),
})

export const bulkChangeRoleSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one ID required"),
  role: z.nativeEnum(Role),
})

export type BulkIdsInput = z.infer<typeof bulkIdsSchema>
export type BulkRejectInput = z.infer<typeof bulkRejectSchema>
export type BulkChangeRoleInput = z.infer<typeof bulkChangeRoleSchema>

export interface BulkActionResult {
  processedCount: number
  failedIds: string[]
  errors: Record<string, string>
}
