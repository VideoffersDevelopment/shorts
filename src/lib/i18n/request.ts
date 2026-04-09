import { getRequestConfig } from 'next-intl/server'
import { type Locale } from './config'

/**
 * NOTE: This file is NOT used by next-intl.
 * The actual config is in /i18n.ts (root), referenced by next.config.mjs.
 * This file exists only as a legacy reference.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'pl'

  return {
    locale,
    messages: {}
  }
})
