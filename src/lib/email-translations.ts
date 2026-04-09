/**
 * Email Translation Helper
 *
 * Server-side helper for loading email translations.
 * Email templates cannot use React hooks (useTranslations),
 * so translations are loaded and passed as props.
 */

import { defaultLocale, locales } from '@/lib/i18n/config'

// Type definitions for email translations
export interface VerifyEmailTranslations {
  subject: string
  preview: string
  title: string
  body: string
  button: string
  footer: string
}

export interface PasswordResetTranslations {
  subject: string
  preview: string
  title: string
  body: string
  button: string
  footer: string
}

export interface WelcomeTranslations {
  subject: string
  preview: string
  title: string
  body1: string
  body2: string
  button: string
  footer: string
}

export interface CompanyVerifiedTranslations {
  subject: string
  title: string
  body: string
  footer: string
}

export interface CompanyRejectedTranslations {
  subject: string
  title: string
  body: string
  reason: string
  footer: string
}

export interface EmailTranslations {
  verifyEmail: VerifyEmailTranslations
  passwordReset: PasswordResetTranslations
  welcome: WelcomeTranslations
  companyVerified: CompanyVerifiedTranslations
  companyRejected: CompanyRejectedTranslations
}

/**
 * Load email translations for a specific locale
 * Falls back to default locale if the requested locale is not available
 */
export async function getEmailTranslations(locale: string): Promise<EmailTranslations> {
  // Validate locale
  const validLocale = locales.includes(locale as typeof locales[number])
    ? locale
    : defaultLocale

  try {
    const translations = await import(`./locales/${validLocale}/emails.json`)
    return translations.default as EmailTranslations
  } catch {
    // Fallback to default locale if import fails
    const fallback = await import(`./locales/${defaultLocale}/emails.json`)
    return fallback.default as EmailTranslations
  }
}

/**
 * Get specific email template translations
 */
export async function getVerifyEmailTranslations(locale: string): Promise<VerifyEmailTranslations> {
  const translations = await getEmailTranslations(locale)
  return translations.verifyEmail
}

export async function getPasswordResetTranslations(locale: string): Promise<PasswordResetTranslations> {
  const translations = await getEmailTranslations(locale)
  return translations.passwordReset
}

export async function getWelcomeTranslations(locale: string): Promise<WelcomeTranslations> {
  const translations = await getEmailTranslations(locale)
  return translations.welcome
}

export async function getCompanyVerifiedTranslations(locale: string): Promise<CompanyVerifiedTranslations> {
  const translations = await getEmailTranslations(locale)
  return translations.companyVerified
}

export async function getCompanyRejectedTranslations(locale: string): Promise<CompanyRejectedTranslations> {
  const translations = await getEmailTranslations(locale)
  return translations.companyRejected
}
