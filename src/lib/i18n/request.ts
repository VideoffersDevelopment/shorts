import { getRequestConfig } from 'next-intl/server'
import { type Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  // Load all translation namespaces and merge them
  const [
    auth,
    common,
    settings,
    preferences,
    profile,
    sidebar,
    companies,
    admin,
    adminCategories,
    categories,
    home
  ] = await Promise.all([
    import(`../locales/${locale}/auth.json`),
    import(`../locales/${locale}/common.json`),
    import(`../locales/${locale}/settings.json`),
    import(`../locales/${locale}/preferences.json`),
    import(`../locales/${locale}/profile.json`),
    import(`../locales/${locale}/sidebar.json`),
    import(`../locales/${locale}/companies.json`),
    import(`../locales/${locale}/admin.json`),
    import(`../locales/${locale}/admin-categories.json`),
    import(`../locales/${locale}/categories.json`),
    import(`../locales/${locale}/home.json`)
  ])

  return {
    messages: {
      auth: auth.default,
      common: common.default,
      settings: settings.default,
      preferences: preferences.default,
      profile: profile.default,
      sidebar: sidebar.default,
      companies: companies.default,
      admin: admin.default,
      'admin-categories': adminCategories.default,
      categories: categories.default,
      home: home.default
    }
  }
})
