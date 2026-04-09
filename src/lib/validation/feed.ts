import { z } from 'zod'

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['algorithmic', 'newest', 'popular', 'trending', 'following']).default('algorithmic'),
  categoryIds: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  tags: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
  verifiedOnly: z.string().optional().transform(val => val === 'true'),
})

export type FeedQueryParams = z.infer<typeof feedQuerySchema>
