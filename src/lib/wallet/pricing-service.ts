import { prisma } from "@/lib/prisma"
import type { PricingKey } from "./wallet-types"
import { DEFAULT_PRICING } from "./wallet-constants"
import type { PricingConfig } from "@prisma/client"

// In-memory cache
let cache: Map<string, { cost: number; enabled: boolean }> | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Load all pricing from database into cache.
 */
async function loadPricingCache(): Promise<void> {
  try {
    const configs = await prisma.pricingConfig.findMany({
      select: {
        key: true,
        cost: true,
        enabled: true,
      },
    })

    cache = new Map()
    for (const config of configs) {
      cache.set(config.key, {
        cost: config.cost,
        enabled: config.enabled,
      })
    }
    cacheTimestamp = Date.now()
  } catch (error) {
    // Database not available — cache remains null, fall back to defaults
    console.error("Failed to load pricing cache:", error)
    cache = null
    cacheTimestamp = 0
  }
}

/**
 * Check if cache is valid and refresh if needed.
 */
async function ensureCacheValid(): Promise<void> {
  const now = Date.now()
  const isCacheExpired = cache === null || now - cacheTimestamp > CACHE_TTL_MS

  if (isCacheExpired) {
    await loadPricingCache()
  }
}

/**
 * Get price for a service by key.
 * Reads from DB with 5-minute in-memory cache.
 * Falls back to DEFAULT_PRICING if DB entry missing.
 */
export async function getPrice(key: PricingKey): Promise<number> {
  await ensureCacheValid()

  if (cache?.has(key)) {
    return cache.get(key)!.cost
  }

  return DEFAULT_PRICING[key].cost
}

/**
 * Check if a service is enabled.
 */
export async function isServiceEnabled(key: PricingKey): Promise<boolean> {
  await ensureCacheValid()

  if (cache?.has(key)) {
    return cache.get(key)!.enabled
  }

  return DEFAULT_PRICING[key].enabled
}

/**
 * Invalidate cache (called after admin updates pricing).
 */
export function invalidatePricingCache(): void {
  cache = null
  cacheTimestamp = 0
}

/**
 * Get all pricing configs (for admin panel).
 * Always reads from DB (no cache).
 */
export async function getAllPricing(): Promise<PricingConfig[]> {
  try {
    return await prisma.pricingConfig.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    })
  } catch (error) {
    console.error("Failed to get all pricing:", error)
    return []
  }
}

/**
 * Seed default pricing if table is empty.
 * Called once during app initialization or migration.
 */
export async function seedDefaultPricing(): Promise<void> {
  try {
    const count = await prisma.pricingConfig.count()

    if (count === 0) {
      const entries = Object.entries(DEFAULT_PRICING).map(([key, config]) => ({
        key,
        label: config.label,
        description: config.description,
        cost: config.cost,
        enabled: config.enabled,
        category: config.category,
      }))

      await prisma.pricingConfig.createMany({
        data: entries,
        skipDuplicates: true,
      })

      console.log(`Seeded ${entries.length} default pricing entries`)
    }
  } catch (error) {
    console.error("Failed to seed default pricing:", error)
  }
}
