import { Resend } from "resend"
import { render } from "@react-email/render"
import { ProcessingCompleteEmail } from "./templates/processing-complete"
import { ExpiryReminderEmail } from "./templates/expiry-reminder"
import { ShortPublishedEmail } from "./templates/short-published"
import { CreditExpiry30dEmail } from "./templates/credit-expiry-30d"
import { CreditExpiry7dEmail } from "./templates/credit-expiry-7d"
import { CreditExpiry1dEmail } from "./templates/credit-expiry-1d"
import { ReachLossWarningEmail } from "./templates/reach-loss-warning"
import { MaintenanceFeeNoticeEmail } from "./templates/maintenance-fee-notice"

/**
 * Email sending utilities using Resend
 *
 * RESEND_LIVE=false -> emails logged to console (dev mode)
 * RESEND_LIVE=true -> emails sent via Resend API
 */

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@videoffers.com"
const IS_LIVE = process.env.RESEND_LIVE === "true"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend or log to console in dev mode
 */
async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (!IS_LIVE) {
    // Dev mode - log to console
    console.log("=== EMAIL (DEV MODE) ===")
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`HTML: ${html.substring(0, 500)}...`)
    console.log("========================")
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    })

    if (error) {
      console.error("Resend error:", error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

// ========================================
// Email functions
// ========================================

export interface ProcessingCompleteEmailOptions {
  to: string
  shortTitle: string
  shortId: string
  publicUrl: string
  locale?: string
}

/**
 * Send processing complete email when a short is published
 */
export async function sendProcessingCompleteEmail({
  to,
  shortTitle,
  shortId,
  publicUrl,
  locale = "en"
}: ProcessingCompleteEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "Twoj film jest opublikowany! - VideoShorts"
    : "Your short is published! - VideoShorts"

  const html = await render(
    ProcessingCompleteEmail({
      shortTitle,
      shortId,
      publicUrl,
      locale
    })
  )

  await sendEmail({ to, subject, html })
}

// ========================================
// Expiry Reminder Email
// ========================================

export interface ExpiryReminderEmailOptions {
  to: string
  shortTitle: string
  shortId: string
  expiresAt: Date
  renewUrl: string
  locale?: string
}

/**
 * Send expiry reminder email 7 days before short expires
 */
export async function sendExpiryReminderEmail({
  to,
  shortTitle,
  shortId,
  expiresAt,
  renewUrl,
  locale = "en"
}: ExpiryReminderEmailOptions): Promise<void> {
  const subjects: Record<string, string> = {
    en: "Your short expires in 7 days! - VideoShorts",
    pl: "Twoj film wygasa za 7 dni! - VideoShorts",
    de: "Ihr Video lauft in 7 Tagen ab! - VideoShorts",
    es: "Tu video expira en 7 dias! - VideoShorts",
    ru: "Vashe video istekaet cherez 7 dney! - VideoShorts",
    uk: "Vashe video spalyue cherez 7 dniv! - VideoShorts"
  }

  const subject = subjects[locale] || subjects.en

  const html = await render(
    ExpiryReminderEmail({
      shortTitle,
      shortId,
      expiresAt,
      renewUrl,
      locale
    })
  )

  await sendEmail({ to, subject, html })
}

// ========================================
// Short Published Email
// ========================================

export interface ShortPublishedEmailOptions {
  to: string
  shortTitle: string
  shortId: string
  publicUrl: string
  expiresAt: Date
  locale?: string
}

/**
 * Send notification email when a short is published
 */
export async function sendShortPublishedEmail({
  to,
  shortTitle,
  shortId,
  publicUrl,
  expiresAt,
  locale = "en"
}: ShortPublishedEmailOptions): Promise<void> {
  const subjects: Record<string, string> = {
    en: "Your short is live! - VideoShorts",
    pl: "Twoj film jest opublikowany! - VideoShorts",
    de: "Ihr Video ist live! - VideoShorts",
    es: "Tu video esta en vivo! - VideoShorts",
    ru: "Vashe video opublikovano! - VideoShorts",
    uk: "Vashe video opublikovano! - VideoShorts"
  }

  const subject = subjects[locale] || subjects.en

  const html = await render(
    ShortPublishedEmail({
      shortTitle,
      shortId,
      publicUrl,
      expiresAt,
      locale
    })
  )

  await sendEmail({ to, subject, html })
}

// ========================================
// Credit Expiry Warnings (30d, 7d, 1d)
// ========================================

export interface CreditExpiryEmailOptions {
  to: string
  points: number
  valuePLN?: string
  expiresAt: Date
  topUpUrl: string
  locale?: string
}

export async function sendCreditExpiry30dEmail({
  to,
  points,
  valuePLN = "0.00",
  expiresAt,
  topUpUrl,
  locale = "en",
}: CreditExpiryEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "Twoje punkty wygasaja za 30 dni - VideoShorts"
    : "Your credits expire in 30 days - VideoShorts"

  const html = await render(
    CreditExpiry30dEmail({ points, valuePLN, expiresAt, topUpUrl, locale })
  )

  await sendEmail({ to, subject, html })
}

export async function sendCreditExpiry7dEmail({
  to,
  points,
  expiresAt,
  topUpUrl,
  locale = "en",
}: CreditExpiryEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "Twoje punkty wygasaja za 7 dni! - VideoShorts"
    : "Your credits expire in 7 days! - VideoShorts"

  const html = await render(
    CreditExpiry7dEmail({ points, expiresAt, topUpUrl, locale })
  )

  await sendEmail({ to, subject, html })
}

export async function sendCreditExpiry1dEmail({
  to,
  points,
  expiresAt,
  topUpUrl,
  locale = "en",
}: CreditExpiryEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "OSTATNI DZIEN - punkty wygasaja jutro! - VideoShorts"
    : "LAST DAY - credits expire tomorrow! - VideoShorts"

  const html = await render(
    CreditExpiry1dEmail({ points, expiresAt, topUpUrl, locale })
  )

  await sendEmail({ to, subject, html })
}

// ========================================
// Reach Loss Warning (PROMO expiring without MAIN purchases)
// ========================================

export interface ReachLossWarningEmailOptions {
  to: string
  views: number
  promoExpiresAt: Date
  topUpUrl: string
  locale?: string
}

export async function sendReachLossWarningEmail({
  to,
  views,
  promoExpiresAt,
  topUpUrl,
  locale = "en",
}: ReachLossWarningEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "Nie strac zasiegu - darmowe punkty wygasaja! - VideoShorts"
    : "Don't lose your reach - free credits expiring! - VideoShorts"

  const html = await render(
    ReachLossWarningEmail({ views, promoExpiresAt, topUpUrl, locale })
  )

  await sendEmail({ to, subject, html })
}

// ========================================
// Maintenance Fee Notice
// ========================================

export interface MaintenanceFeeNoticeEmailOptions {
  to: string
  amount: number
  remainingBalance: number
  topUpUrl: string
  locale?: string
}

export async function sendMaintenanceFeeNoticeEmail({
  to,
  amount,
  remainingBalance,
  topUpUrl,
  locale = "en",
}: MaintenanceFeeNoticeEmailOptions): Promise<void> {
  const subject = locale === "pl"
    ? "Powiadomienie o oplacie utrzymaniowej - VideoShorts"
    : "Maintenance fee notice - VideoShorts"

  const html = await render(
    MaintenanceFeeNoticeEmail({ amount, remainingBalance, topUpUrl, locale })
  )

  await sendEmail({ to, subject, html })
}
