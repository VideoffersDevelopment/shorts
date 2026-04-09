import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale, type Locale } from './src/lib/i18n/config'

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale from the [locale] segment
  const requested = await requestLocale

  // Validate and fallback to default if invalid
  const locale = requested && locales.includes(requested as Locale)
    ? (requested as Locale)
    : defaultLocale

  // Load all translation namespaces
  const [
    auth,
    common,
    profile,
    settings,
    preferences,
    sidebar,
    companies,
    admin,
    adminCategories,
    categories,
    home,
    shorts,
    payments,
    feed,
    search,
    following
  ] = await Promise.all([
    import(`./src/lib/locales/${locale}/auth.json`),
    import(`./src/lib/locales/${locale}/common.json`),
    import(`./src/lib/locales/${locale}/profile.json`),
    import(`./src/lib/locales/${locale}/settings.json`),
    import(`./src/lib/locales/${locale}/preferences.json`),
    import(`./src/lib/locales/${locale}/sidebar.json`),
    import(`./src/lib/locales/${locale}/companies.json`),
    import(`./src/lib/locales/${locale}/admin.json`),
    import(`./src/lib/locales/${locale}/admin-categories.json`),
    import(`./src/lib/locales/${locale}/categories.json`),
    import(`./src/lib/locales/${locale}/home.json`),
    import(`./src/lib/locales/${locale}/shorts.json`),
    import(`./src/lib/locales/${locale}/payments.json`),
    import(`./src/lib/locales/${locale}/feed.json`),
    import(`./src/lib/locales/${locale}/search.json`),
    import(`./src/lib/locales/${locale}/following.json`)
  ])

  return {
    locale,
    messages: {
      auth: auth.default,
      common: common.default,
      profile: profile.default,
      settings: settings.default,
      preferences: preferences.default,
      sidebar: sidebar.default,
      companies: companies.default,
      admin: admin.default,
      'admin-categories': adminCategories.default,
      categories: categories.default,
      home: home.default,
      shorts: shorts.default,
      payments: payments.default,
      feed: feed.default,
      search: search.default,
      following: following.default
    }
  }
})
