import { getTranslations as getNextIntlTranslations } from 'next-intl/server'
import { type Locale, defaultLocale, locales } from './config'

export async function getText(
  key: string,
  namespace: string,
  locale: Locale
): Promise<string> {
  const t = await getNextIntlTranslations({ locale, namespace })
  return t(key)
}

/**
 * Get email translation with variable interpolation
 * Used for server-side email content generation
 */
export async function getEmailText(
  key: string,
  locale?: string | null,
  variables?: Record<string, string>
): Promise<string> {
  // Validate locale or fall back to default
  const validLocale = locale && locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale

  // Import email translations directly (server actions don't have access to next-intl context)
  const emails = await import(`../locales/${validLocale}/emails.json`)

  // Navigate to nested key (e.g., "companyVerified.subject")
  const keys = key.split('.')
  let value: unknown = emails.default
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return key // Return key if not found
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Replace variables {{varName}} with actual values
  if (variables) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
      variables[varName] ?? `{{${varName}}}`
    )
  }

  return value
}
