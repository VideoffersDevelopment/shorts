/**
 * Inngest event types for VideoShorts
 *
 * These events are used to trigger background jobs:
 * - shorts/transcode.started: Trigger Qencode transcoding
 * - shorts/transcode.completed: Cleanup raw video after transcoding
 * - shorts/auto-archive: Daily job to archive expired shorts
 * - shorts/expiry-reminder: Daily job to send 7-day expiry warnings
 */

/**
 * Event: Start video transcoding
 */
export interface TranscodeStartedEvent {
  name: "shorts/transcode.started"
  data: {
    shortId: string
    rawVideoKey: string
    userId: string
  }
}

/**
 * Event: Transcoding completed (webhook from Qencode)
 */
export interface TranscodeCompletedEvent {
  name: "shorts/transcode.completed"
  data: {
    shortId: string
    qencodeTaskId: string
    hlsPlaylistUrl: string
    thumbnailUrl: string | null
    duration: number
    success: boolean
    error?: string
  }
}

/**
 * Event: Expire published shorts (cron job, Phase 1: PUBLISHED → EXPIRED)
 */
export interface ExpireShortsEvent {
  name: "shorts/expire-published"
  data: Record<string, never>
}

/**
 * Event: Deep archive expired shorts (cron job, Phase 2: EXPIRED → ARCHIVED)
 */
export interface DeepArchiveEvent {
  name: "shorts/deep-archive"
  data: Record<string, never>
}

/**
 * Event: Expire active boosts (cron job, hourly)
 */
export interface ExpireBoostsEvent {
  name: "shorts/expire-boosts"
  data: Record<string, never>
}

/**
 * Event: Send expiry reminder notifications (cron job)
 */
export interface ExpiryReminderEvent {
  name: "shorts/expiry-reminder"
  data: Record<string, never>
}

/**
 * Event: Expire PROMO grant batches (cron job, daily)
 */
export interface ExpirePromoGrantsEvent {
  name: "wallet/expire-promo-grants"
  data: Record<string, never>
}

/**
 * Event: Charge maintenance fee for inactive users (cron job, monthly)
 */
export interface ChargeMaintenanceFeeEvent {
  name: "wallet/charge-maintenance-fee"
  data: Record<string, never>
}

/**
 * Event: Send retention notifications (cron job, daily)
 */
export interface RetentionNotificationsEvent {
  name: "wallet/retention-notifications"
  data: Record<string, never>
}

/**
 * Event: Payment completed successfully
 */
export interface PaymentCompletedEvent {
  name: "payments/completed"
  data: {
    paymentId: string
    userId: string
    credits: number
    shortId?: string
  }
}

/**
 * All Inngest events union type
 */
export type InngestEvents =
  | TranscodeStartedEvent
  | TranscodeCompletedEvent
  | ExpireShortsEvent
  | DeepArchiveEvent
  | ExpireBoostsEvent
  | ExpiryReminderEvent
  | ExpirePromoGrantsEvent
  | ChargeMaintenanceFeeEvent
  | RetentionNotificationsEvent
  | PaymentCompletedEvent

/**
 * Event name literals for type safety
 */
export type InngestEventName = InngestEvents["name"]
