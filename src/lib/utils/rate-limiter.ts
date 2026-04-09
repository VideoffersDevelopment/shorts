/**
 * In-memory sliding window rate limiter.
 *
 * For production scale this should be replaced with Redis,
 * but in-memory is sufficient for the current single-process setup.
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, number[]>()

  // Cleanup old entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs)
      if (valid.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, valid)
      }
    }
  }, 5 * 60 * 1000)

  // Allow cleanup interval to not prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const timestamps = requests.get(key) ?? []
      const valid = timestamps.filter((t) => now - t < windowMs)

      if (valid.length >= maxRequests) {
        const oldestInWindow = valid[0]
        const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000)
        return {
          allowed: false,
          remaining: 0,
          retryAfter,
        }
      }

      valid.push(now)
      requests.set(key, valid)

      return {
        allowed: true,
        remaining: maxRequests - valid.length,
      }
    },
  }
}

/** 100 reactions per minute */
export const reactionLimiter = createRateLimiter(60 * 1000, 100)

/** 100 comments per day */
export const commentLimiter = createRateLimiter(24 * 60 * 60 * 1000, 100)
