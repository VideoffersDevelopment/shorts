export const locales = ['pl', 'en', 'de', 'es', 'ru', 'uk'] as const
export const defaultLocale = 'pl' as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  ru: 'Русский',
  uk: 'Українська'
}
