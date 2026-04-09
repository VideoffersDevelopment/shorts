import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { inngestFunctions } from "@/lib/inngest/functions"

// Debug: Log registered functions count
console.log("[Inngest API] Registered functions count:", inngestFunctions.length)

/**
 * Inngest API Route Handler
 *
 * This route handles:
 * - GET: Inngest dashboard introspection
 * - POST: Event processing from Inngest
 * - PUT: Function execution from Inngest
 *
 * All registered functions are exported from @/lib/inngest/functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
  // Vercel automatically sets VERCEL_URL, use it for serve host
  ...(process.env.VERCEL_URL && {
    serveHost: `https://${process.env.VERCEL_URL}`,
    servePath: "/api/inngest"
  })
})
