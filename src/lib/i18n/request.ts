import { getRequestConfig } from 'next-intl/server'
import { type Locale } from './config'

async function loadNamespace(locale: string, ns: string) {
  try {
    const mod = await import(`../locales/${locale}/${ns}.json`)
    return mod.default
  } catch {
    return {}
  }
}

const NAMESPACES = [
  'auth',
  'common',
  'settings',
  'preferences',
  'profile',
  'sidebar',
  'companies',
  'admin',
  'admin-categories',
  'categories',
  'home',
  'following',
  'shorts',
  'feed',
  'search',
  'payments',
] as const

export default getRequestConfig(async ({ locale }) => {
  const results = await Promise.all(
    NAMESPACES.map((ns) => loadNamespace(locale as string, ns))
  )

  const messages: Record<string, Record<string, unknown>> = {}
  NAMESPACES.forEach((ns, i) => {
    messages[ns] = results[i]
  })

  return { messages }
})
