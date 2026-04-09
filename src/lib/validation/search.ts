import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  type: z.enum(['all', 'shorts', 'companies']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryIds: z.string().optional().transform(val =>
    val ? val.split(',').filter(Boolean) : undefined
  ),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
})

export const suggestionsQuerySchema = z.object({
  q: z.string().min(1, 'Query must be at least 1 character'),
})

export type SearchQueryParams = z.infer<typeof searchQuerySchema>
export type SuggestionsQueryParams = z.infer<typeof suggestionsQuerySchema>
