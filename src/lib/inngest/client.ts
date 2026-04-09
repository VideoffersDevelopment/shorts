import { Inngest, EventSchemas } from "inngest"
import { type InngestEvents } from "./events"

// Log configuration status on initialization (helps debug Vercel)
const eventKey = process.env.INNGEST_EVENT_KEY
if (!eventKey) {
  console.warn("[Inngest] WARNING: INNGEST_EVENT_KEY is not set!")
} else {
  console.log("[Inngest] Event key configured (length:", eventKey.length, ")")
}

/**
 * Inngest client for VideoShorts background jobs
 *
 * Used for:
 * - Video transcoding workflows
 * - Auto-archive expired shorts
 * - Expiry reminder notifications
 */
export const inngest = new Inngest({
  id: "videoshorts",
  schemas: new EventSchemas().fromUnion<InngestEvents>(),
  eventKey
})

// Re-export types for convenience
export type { InngestEvents }
