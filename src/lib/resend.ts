import { Resend } from 'resend'
import { render } from '@react-email/render'
import { VerifyEmail } from '@/emails/verify-email'
import { PasswordReset } from '@/emails/password-reset'
import { Welcome } from '@/emails/welcome'
import {
  getVerifyEmailTranslations,
  getPasswordResetTranslations,
  getWelcomeTranslations
} from '@/lib/email-translations'

// Dev mode: when RESEND_LIVE is not 'true', emails are logged to console instead of sending
const isDevMode = process.env.RESEND_LIVE !== 'true'

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'VideoShorts <noreply@videoffers.com>'
}: SendEmailOptions): Promise<{ id: string } | null> {
  // Dev mode: log email to console instead of sending
  if (isDevMode) {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (DEV MODE - not sent)')
    console.log('='.repeat(60))
    console.log(`From: ${from}`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('-'.repeat(60))
    console.log('HTML Content:')
    console.log(html)
    console.log('='.repeat(60) + '\n')

    // Return fake ID for dev mode
    return { id: `dev-${Date.now()}` }
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }

  return data
}

export async function generateVerificationEmail(token: string, locale: string = 'pl'): Promise<string> {
  const translations = await getVerifyEmailTranslations(locale)
  return await render(VerifyEmail({ token, locale, translations }))
}

export async function generatePasswordResetEmail(token: string, locale: string = 'pl'): Promise<string> {
  const translations = await getPasswordResetTranslations(locale)
  return await render(PasswordReset({ token, locale, translations }))
}

export async function generateWelcomeEmail(locale: string = 'pl'): Promise<string> {
  const translations = await getWelcomeTranslations(locale)
  return await render(Welcome({ locale, translations }))
}

export async function sendVerificationEmail(email: string, token: string, locale: string = 'pl'): Promise<void> {
  const translations = await getVerifyEmailTranslations(locale)
  const html = await generateVerificationEmail(token, locale)
  await sendEmail({
    to: email,
    subject: translations.subject,
    html
  })
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = 'pl'): Promise<void> {
  const translations = await getPasswordResetTranslations(locale)
  const html = await generatePasswordResetEmail(token, locale)
  await sendEmail({
    to: email,
    subject: translations.subject,
    html
  })
}

export async function sendWelcomeEmail(email: string, locale: string = 'pl'): Promise<void> {
  const translations = await getWelcomeTranslations(locale)
  const html = await generateWelcomeEmail(locale)
  await sendEmail({
    to: email,
    subject: translations.subject,
    html
  })
}
