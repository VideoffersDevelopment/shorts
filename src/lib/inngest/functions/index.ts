/**
 * Export all Inngest functions
 *
 * These functions handle background jobs for VideoShorts:
 * - Video transcoding (start-transcoding)
 * - Cleanup after transcoding (cleanup-raw-video)
 * - Expire published shorts (Phase 1: PUBLISHED → EXPIRED)
 * - Deep archive expired shorts (Phase 2: EXPIRED → ARCHIVED + R2 cleanup)
 * - Expire active boosts (ACTIVE → COMPLETED after 24h)
 * - Send expiry reminders (send-expiry-reminders)
 * - Expire PROMO grant batches (daily, wallet cron)
 * - Charge maintenance fee (monthly, wallet cron)
 * - Send retention notifications (daily, wallet cron)
 */

export { startTranscoding } from "./process-video"
export { cleanupRawVideo } from "./cleanup-video"
export { expirePublishedShorts } from "./archive-expired"
export { deepArchiveExpiredShorts } from "./deep-archive"
export { expireActiveBoosts } from "./expire-boosts"
export { sendExpiryReminders } from "./expiry-reminder"
export { expirePromoGrants } from "./grant-expiration"
export { chargeMaintenanceFee } from "./maintenance-fee"
export { sendRetentionNotifications } from "./retention-notifier"

// Re-export as array for easy registration
import { startTranscoding } from "./process-video"
import { cleanupRawVideo } from "./cleanup-video"
import { expirePublishedShorts } from "./archive-expired"
import { deepArchiveExpiredShorts } from "./deep-archive"
import { expireActiveBoosts } from "./expire-boosts"
import { sendExpiryReminders } from "./expiry-reminder"
import { expirePromoGrants } from "./grant-expiration"
import { chargeMaintenanceFee } from "./maintenance-fee"
import { sendRetentionNotifications } from "./retention-notifier"

export const inngestFunctions = [
  startTranscoding,
  cleanupRawVideo,
  expirePublishedShorts,
  deepArchiveExpiredShorts,
  expireActiveBoosts,
  sendExpiryReminders,
  expirePromoGrants,
  chargeMaintenanceFee,
  sendRetentionNotifications,
]
