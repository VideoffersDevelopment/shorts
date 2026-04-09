import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// ===========================================================================
// CONSTANTS & HELPERS
// ===========================================================================

const LOCALES = ['pl', 'en', 'de', 'es', 'ru', 'uk'] as const
const NAMESPACES = ['feed', 'search'] as const
const REFERENCE_LOCALE = 'en'

type Locale = (typeof LOCALES)[number]
type Namespace = (typeof NAMESPACES)[number]

interface TranslationObject {
  [key: string]: string | TranslationObject
}

/**
 * Load translation file for a specific locale and namespace
 */
const loadTranslations = (locale: Locale, namespace: Namespace): TranslationObject => {
  const filePath = path.join(
    process.cwd(),
    'src/lib/locales',
    locale,
    `${namespace}.json`
  )
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as TranslationObject
}

/**
 * Get all nested keys from a translation object with dot notation
 */
const getAllKeys = (obj: TranslationObject, prefix = ''): string[] => {
  return Object.entries(obj).flatMap(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return getAllKeys(value as TranslationObject, newKey)
    }
    return [newKey]
  })
}

/**
 * Get value from nested object using dot notation key
 */
const getNestedValue = (obj: TranslationObject, key: string): string | undefined => {
  const keys = key.split('.')
  let current: TranslationObject | string = obj

  for (const k of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined
    }
    current = current[k]
  }

  return typeof current === 'string' ? current : undefined
}

/**
 * Extract interpolation placeholders from translation string
 * Matches {variable} patterns
 */
const extractPlaceholders = (text: string): string[] => {
  const regex = /\{(\w+)\}/g
  const placeholders: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[1])
  }

  return placeholders
}

// ===========================================================================
// JSON VALIDITY
// ===========================================================================

describe('JSON Validity', () => {
  describe('feed.json files', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/feed.json is valid JSON`, () => {
        const filePath = path.join(
          process.cwd(),
          'src/lib/locales',
          locale,
          'feed.json'
        )

        expect(() => {
          const content = fs.readFileSync(filePath, 'utf-8')
          JSON.parse(content)
        }).not.toThrow()
      })
    })
  })

  describe('search.json files', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/search.json is valid JSON`, () => {
        const filePath = path.join(
          process.cwd(),
          'src/lib/locales',
          locale,
          'search.json'
        )

        expect(() => {
          const content = fs.readFileSync(filePath, 'utf-8')
          JSON.parse(content)
        }).not.toThrow()
      })
    })
  })
})

// ===========================================================================
// KEY CONSISTENCY
// ===========================================================================

describe('Key Consistency', () => {
  describe('feed.json key consistency', () => {
    const referenceTranslations = loadTranslations(REFERENCE_LOCALE, 'feed')
    const referenceKeys = getAllKeys(referenceTranslations).sort()

    LOCALES.filter((locale) => locale !== REFERENCE_LOCALE).forEach((locale) => {
      it(`${locale}/feed.json has same keys as ${REFERENCE_LOCALE}/feed.json`, () => {
        const translations = loadTranslations(locale, 'feed')
        const keys = getAllKeys(translations).sort()

        expect(keys).toEqual(referenceKeys)
      })
    })

    it('all languages have the same number of feed.json keys', () => {
      const keyCounts = LOCALES.map((locale) => {
        const translations = loadTranslations(locale, 'feed')
        return {
          locale,
          count: getAllKeys(translations).length,
        }
      })

      const referenceCount = keyCounts.find((k) => k.locale === REFERENCE_LOCALE)!.count
      keyCounts.forEach(({ locale, count }) => {
        expect(count).toBe(referenceCount)
      })
    })
  })

  describe('search.json key consistency', () => {
    const referenceTranslations = loadTranslations(REFERENCE_LOCALE, 'search')
    const referenceKeys = getAllKeys(referenceTranslations).sort()

    LOCALES.filter((locale) => locale !== REFERENCE_LOCALE).forEach((locale) => {
      it(`${locale}/search.json has same keys as ${REFERENCE_LOCALE}/search.json`, () => {
        const translations = loadTranslations(locale, 'search')
        const keys = getAllKeys(translations).sort()

        expect(keys).toEqual(referenceKeys)
      })
    })

    it('all languages have the same number of search.json keys', () => {
      const keyCounts = LOCALES.map((locale) => {
        const translations = loadTranslations(locale, 'search')
        return {
          locale,
          count: getAllKeys(translations).length,
        }
      })

      const referenceCount = keyCounts.find((k) => k.locale === REFERENCE_LOCALE)!.count
      keyCounts.forEach(({ locale, count }) => {
        expect(count).toBe(referenceCount)
      })
    })
  })

  describe('no missing keys compared to English', () => {
    NAMESPACES.forEach((namespace) => {
      const referenceTranslations = loadTranslations(REFERENCE_LOCALE, namespace)
      const referenceKeys = getAllKeys(referenceTranslations)

      LOCALES.filter((locale) => locale !== REFERENCE_LOCALE).forEach((locale) => {
        it(`${locale}/${namespace}.json has all keys from English`, () => {
          const translations = loadTranslations(locale, namespace)
          const keys = getAllKeys(translations)

          const missingKeys = referenceKeys.filter((key) => !keys.includes(key))
          expect(missingKeys).toEqual([])
        })

        it(`${locale}/${namespace}.json has no extra keys beyond English`, () => {
          const translations = loadTranslations(locale, namespace)
          const keys = getAllKeys(translations)

          const extraKeys = keys.filter((key) => !referenceKeys.includes(key))
          expect(extraKeys).toEqual([])
        })
      })
    })
  })
})

// ===========================================================================
// REQUIRED KEYS - FEED.JSON
// ===========================================================================

describe('Required Keys - feed.json', () => {
  const requiredFeedKeys = [
    // Sort
    'sort.label',
    'sort.algorithmic',
    'sort.newest',
    'sort.popular',
    'sort.trending',
    'sort.following',
    // Filters
    'filters.title',
    'filters.apply',
    'filters.clear',
    // Location
    'filters.location.label',
    'filters.location.radius',
    'filters.location.detectLocation',
    'filters.location.detecting',
    'filters.location.wholeCountry',
    'filters.location.nearMe',
    'filters.location.radiusOptions.1km',
    'filters.location.radiusOptions.5km',
    'filters.location.radiusOptions.10km',
    'filters.location.radiusOptions.25km',
    'filters.location.radiusOptions.50km',
    'filters.location.radiusOptions.all',
    // Categories
    'filters.categories.label',
    'filters.categories.placeholder',
    'filters.categories.maxSelected',
    // Tags
    'filters.tags.label',
    'filters.tags.placeholder',
    // Verified
    'filters.verifiedOnly.label',
    'filters.verifiedOnly.description',
    // Active filters
    'filters.activeFilters',
    // Empty states
    'empty.noShorts.title',
    'empty.noShorts.description',
    'empty.noShorts.expandRadius',
    'empty.noShorts.clearFilters',
    'empty.noShorts.browseAll',
    'empty.noFollowing.title',
    'empty.noFollowing.description',
    'empty.noFollowing.discoverCta',
    // Loading
    'loading.more',
    'loading.skeleton',
    // Card
    'card.views',
    'card.likes',
    'card.distance',
  ]

  LOCALES.forEach((locale) => {
    describe(`${locale}/feed.json`, () => {
      const translations = loadTranslations(locale, 'feed')
      const keys = getAllKeys(translations)

      requiredFeedKeys.forEach((requiredKey) => {
        it(`has required key: ${requiredKey}`, () => {
          expect(keys).toContain(requiredKey)
        })
      })

      it('has all required feed.json keys', () => {
        const missingKeys = requiredFeedKeys.filter((key) => !keys.includes(key))
        expect(missingKeys).toEqual([])
      })
    })
  })
})

// ===========================================================================
// REQUIRED KEYS - SEARCH.JSON
// ===========================================================================

describe('Required Keys - search.json', () => {
  const requiredSearchKeys = [
    // Bar
    'bar.placeholder',
    'bar.shortcut',
    'bar.clear',
    // Company
    'company.shortsCount',
    // Suggestions
    'suggestions.recent',
    'suggestions.popular',
    'suggestions.shorts',
    'suggestions.companies',
    'suggestions.clearRecent',
    // Tabs
    'tabs.all',
    'tabs.shorts',
    'tabs.companies',
    // Results
    'results.title',
    'results.count',
    'results.noResults.title',
    'results.noResults.description',
    'results.noResults.suggestions',
    // Filters
    'filters.inCategory',
    'filters.inLocation',
    // Loading
    'loading',
  ]

  LOCALES.forEach((locale) => {
    describe(`${locale}/search.json`, () => {
      const translations = loadTranslations(locale, 'search')
      const keys = getAllKeys(translations)

      requiredSearchKeys.forEach((requiredKey) => {
        it(`has required key: ${requiredKey}`, () => {
          expect(keys).toContain(requiredKey)
        })
      })

      it('has all required search.json keys', () => {
        const missingKeys = requiredSearchKeys.filter((key) => !keys.includes(key))
        expect(missingKeys).toEqual([])
      })
    })
  })
})

// ===========================================================================
// INTERPOLATION SYNTAX
// ===========================================================================

describe('Interpolation Syntax', () => {
  describe('feed.json interpolation placeholders', () => {
    const keysWithPlaceholders = [
      { key: 'filters.location.nearMe', expectedPlaceholders: ['distance'] },
      { key: 'filters.categories.maxSelected', expectedPlaceholders: ['max'] },
      { key: 'filters.activeFilters', expectedPlaceholders: ['count'] },
      { key: 'card.views', expectedPlaceholders: ['count'] },
      { key: 'card.likes', expectedPlaceholders: ['count'] },
      { key: 'card.distance', expectedPlaceholders: ['distance'] },
    ]

    LOCALES.forEach((locale) => {
      describe(`${locale}/feed.json`, () => {
        const translations = loadTranslations(locale, 'feed')

        keysWithPlaceholders.forEach(({ key, expectedPlaceholders }) => {
          it(`${key} has correct placeholders: {${expectedPlaceholders.join('}, {')}}`, () => {
            const value = getNestedValue(translations, key)
            expect(value).toBeDefined()

            const placeholders = extractPlaceholders(value!)
            expect(placeholders.sort()).toEqual(expectedPlaceholders.sort())
          })
        })
      })
    })

    it('placeholder names are consistent across all feed.json languages', () => {
      const keysToCheck = ['filters.location.nearMe', 'card.views', 'card.likes']

      keysToCheck.forEach((key) => {
        const placeholdersByLocale = LOCALES.map((locale) => {
          const translations = loadTranslations(locale, 'feed')
          const value = getNestedValue(translations, key)
          return {
            locale,
            placeholders: value ? extractPlaceholders(value).sort() : [],
          }
        })

        const referencePlaceholders = placeholdersByLocale.find(
          (p) => p.locale === REFERENCE_LOCALE
        )!.placeholders

        placeholdersByLocale.forEach(({ locale, placeholders }) => {
          expect(placeholders).toEqual(referencePlaceholders)
        })
      })
    })
  })

  describe('search.json interpolation placeholders', () => {
    const keysWithPlaceholders = [
      { key: 'company.shortsCount', expectedPlaceholders: ['count'] },
      { key: 'results.title', expectedPlaceholders: ['query'] },
      { key: 'results.count', expectedPlaceholders: ['count'] },
      { key: 'results.noResults.title', expectedPlaceholders: ['query'] },
    ]

    LOCALES.forEach((locale) => {
      describe(`${locale}/search.json`, () => {
        const translations = loadTranslations(locale, 'search')

        keysWithPlaceholders.forEach(({ key, expectedPlaceholders }) => {
          it(`${key} has correct placeholders: {${expectedPlaceholders.join('}, {')}}`, () => {
            const value = getNestedValue(translations, key)
            expect(value).toBeDefined()

            const placeholders = extractPlaceholders(value!)
            expect(placeholders.sort()).toEqual(expectedPlaceholders.sort())
          })
        })
      })
    })

    it('placeholder names are consistent across all search.json languages', () => {
      const keysToCheck = ['results.title', 'results.count', 'results.noResults.title']

      keysToCheck.forEach((key) => {
        const placeholdersByLocale = LOCALES.map((locale) => {
          const translations = loadTranslations(locale, 'search')
          const value = getNestedValue(translations, key)
          return {
            locale,
            placeholders: value ? extractPlaceholders(value).sort() : [],
          }
        })

        const referencePlaceholders = placeholdersByLocale.find(
          (p) => p.locale === REFERENCE_LOCALE
        )!.placeholders

        placeholdersByLocale.forEach(({ locale, placeholders }) => {
          expect(placeholders).toEqual(referencePlaceholders)
        })
      })
    })
  })

  describe('interpolation syntax validity', () => {
    NAMESPACES.forEach((namespace) => {
      LOCALES.forEach((locale) => {
        it(`${locale}/${namespace}.json uses valid {variable} interpolation syntax`, () => {
          const translations = loadTranslations(locale, namespace)
          const keys = getAllKeys(translations)

          keys.forEach((key) => {
            const value = getNestedValue(translations, key)
            if (value) {
              // Check for malformed placeholders like {}, { variable}, {variable }
              const malformedPatterns = [
                /\{\s+\w+\}/, // Leading space
                /\{\w+\s+\}/, // Trailing space
                /\{\}/, // Empty placeholder
                /\{[^}]*\{/, // Nested braces
              ]

              malformedPatterns.forEach((pattern) => {
                expect(value).not.toMatch(pattern)
              })
            }
          })
        })
      })
    })
  })
})

// ===========================================================================
// CHARACTER ENCODING
// ===========================================================================

describe('Character Encoding', () => {
  describe('Polish translations', () => {
    const polishDiacritics = ['a', 'c', 'e', 'l', 'n', 'o', 's', 'z', 'z']
    const polishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/

    it('pl/feed.json contains Polish diacritics', () => {
      const translations = loadTranslations('pl', 'feed')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(polishChars)
    })

    it('pl/search.json contains Polish diacritics', () => {
      const translations = loadTranslations('pl', 'search')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(polishChars)
    })

    it('pl translations contain specific Polish characters', () => {
      const feedTranslations = loadTranslations('pl', 'feed')
      const searchTranslations = loadTranslations('pl', 'search')
      const allText =
        JSON.stringify(feedTranslations) + JSON.stringify(searchTranslations)

      // Check for common Polish diacritics
      expect(allText).toContain('ą')
      expect(allText).toContain('ę')
      expect(allText).toContain('ó')
      expect(allText).toContain('ł')
      expect(allText).toContain('ś')
      expect(allText).toContain('ć')
      expect(allText).toContain('ń')
      expect(allText).toContain('ź')
      expect(allText).toContain('ż')
    })
  })

  describe('German translations', () => {
    const germanUmlauts = /[äöüÄÖÜß]/

    it('de/feed.json contains German umlauts', () => {
      const translations = loadTranslations('de', 'feed')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(germanUmlauts)
    })

    it('de/search.json contains German umlauts', () => {
      const translations = loadTranslations('de', 'search')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(germanUmlauts)
    })

    it('de translations contain specific German umlauts', () => {
      const feedTranslations = loadTranslations('de', 'feed')
      const searchTranslations = loadTranslations('de', 'search')
      const allText =
        JSON.stringify(feedTranslations) + JSON.stringify(searchTranslations)

      // Check for German umlauts
      expect(allText).toContain('ü')
      expect(allText).toContain('ö')
    })
  })

  describe('Spanish translations', () => {
    const spanishAccents = /[áéíóúñÁÉÍÓÚÑ¿¡]/

    it('es/feed.json contains Spanish accents', () => {
      const translations = loadTranslations('es', 'feed')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(spanishAccents)
    })

    it('es/search.json contains Spanish accents', () => {
      const translations = loadTranslations('es', 'search')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(spanishAccents)
    })

    it('es translations contain specific Spanish characters', () => {
      const feedTranslations = loadTranslations('es', 'feed')
      const searchTranslations = loadTranslations('es', 'search')
      const allText =
        JSON.stringify(feedTranslations) + JSON.stringify(searchTranslations)

      // Check for Spanish accents
      expect(allText).toContain('á')
      expect(allText).toContain('í')
      expect(allText).toContain('ó')
    })
  })

  describe('Russian translations', () => {
    const cyrillicChars = /[\u0400-\u04FF]/

    it('ru/feed.json contains Cyrillic characters', () => {
      const translations = loadTranslations('ru', 'feed')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(cyrillicChars)
    })

    it('ru/search.json contains Cyrillic characters', () => {
      const translations = loadTranslations('ru', 'search')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(cyrillicChars)
    })

    it('ru translations contain specific Cyrillic letters', () => {
      const feedTranslations = loadTranslations('ru', 'feed')
      const allText = JSON.stringify(feedTranslations)

      // Check for common Russian letters
      expect(allText).toContain('а')
      expect(allText).toContain('е')
      expect(allText).toContain('и')
      expect(allText).toContain('о')
      expect(allText).toContain('р')
    })
  })

  describe('Ukrainian translations', () => {
    const cyrillicChars = /[\u0400-\u04FF]/
    const ukrainianSpecificChars = /[іїєґІЇЄҐ]/

    it('uk/feed.json contains Cyrillic characters', () => {
      const translations = loadTranslations('uk', 'feed')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(cyrillicChars)
    })

    it('uk/search.json contains Cyrillic characters', () => {
      const translations = loadTranslations('uk', 'search')
      const allText = JSON.stringify(translations)

      expect(allText).toMatch(cyrillicChars)
    })

    it('uk translations contain Ukrainian-specific characters (i, yi, ye)', () => {
      const feedTranslations = loadTranslations('uk', 'feed')
      const searchTranslations = loadTranslations('uk', 'search')
      const allText =
        JSON.stringify(feedTranslations) + JSON.stringify(searchTranslations)

      // Check for Ukrainian-specific letters
      expect(allText).toContain('і') // Ukrainian i
      expect(allText).toContain('ї') // Ukrainian yi
    })
  })
})

// ===========================================================================
// VALUE NON-EMPTY
// ===========================================================================

describe('Non-Empty Values', () => {
  NAMESPACES.forEach((namespace) => {
    LOCALES.forEach((locale) => {
      it(`${locale}/${namespace}.json has no empty string values`, () => {
        const translations = loadTranslations(locale, namespace)
        const keys = getAllKeys(translations)

        keys.forEach((key) => {
          const value = getNestedValue(translations, key)
          expect(value).not.toBe('')
        })
      })

      it(`${locale}/${namespace}.json has no whitespace-only values`, () => {
        const translations = loadTranslations(locale, namespace)
        const keys = getAllKeys(translations)

        keys.forEach((key) => {
          const value = getNestedValue(translations, key)
          if (value) {
            expect(value.trim()).not.toBe('')
          }
        })
      })
    })
  })
})

// ===========================================================================
// STRUCTURE INTEGRITY
// ===========================================================================

describe('Structure Integrity', () => {
  describe('feed.json structure', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/feed.json has correct top-level structure`, () => {
        const translations = loadTranslations(locale, 'feed')

        expect(translations).toHaveProperty('sort')
        expect(translations).toHaveProperty('filters')
        expect(translations).toHaveProperty('empty')
        expect(translations).toHaveProperty('loading')
        expect(translations).toHaveProperty('card')
      })

      it(`${locale}/feed.json sort has all options`, () => {
        const translations = loadTranslations(locale, 'feed')
        const sort = translations.sort as TranslationObject

        expect(sort).toHaveProperty('label')
        expect(sort).toHaveProperty('algorithmic')
        expect(sort).toHaveProperty('newest')
        expect(sort).toHaveProperty('popular')
        expect(sort).toHaveProperty('trending')
        expect(sort).toHaveProperty('following')
      })

      it(`${locale}/feed.json filters.location has radiusOptions`, () => {
        const translations = loadTranslations(locale, 'feed')
        const filters = translations.filters as TranslationObject
        const location = filters.location as TranslationObject

        expect(location).toHaveProperty('radiusOptions')
        expect(typeof location.radiusOptions).toBe('object')
      })
    })
  })

  describe('search.json structure', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/search.json has correct top-level structure`, () => {
        const translations = loadTranslations(locale, 'search')

        expect(translations).toHaveProperty('bar')
        expect(translations).toHaveProperty('suggestions')
        expect(translations).toHaveProperty('tabs')
        expect(translations).toHaveProperty('results')
        expect(translations).toHaveProperty('filters')
        expect(translations).toHaveProperty('loading')
      })

      it(`${locale}/search.json results has noResults nested object`, () => {
        const translations = loadTranslations(locale, 'search')
        const results = translations.results as TranslationObject

        expect(results).toHaveProperty('noResults')
        expect(typeof results.noResults).toBe('object')
      })
    })
  })
})

// ===========================================================================
// TRANSLATION CONTENT SANITY
// ===========================================================================

describe('Translation Content Sanity', () => {
  describe('sort options are distinct', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/feed.json sort options are all unique`, () => {
        const translations = loadTranslations(locale, 'feed')
        const sort = translations.sort as TranslationObject
        const sortValues = [
          sort.algorithmic,
          sort.newest,
          sort.popular,
          sort.trending,
          sort.following,
        ]

        const uniqueValues = new Set(sortValues)
        expect(uniqueValues.size).toBe(sortValues.length)
      })
    })
  })

  describe('tabs are distinct', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/search.json tabs are all unique`, () => {
        const translations = loadTranslations(locale, 'search')
        const tabs = translations.tabs as TranslationObject
        const tabValues = [tabs.all, tabs.shorts, tabs.companies]

        const uniqueValues = new Set(tabValues)
        expect(uniqueValues.size).toBe(tabValues.length)
      })
    })
  })

  describe('radius options have consistent format', () => {
    LOCALES.forEach((locale) => {
      it(`${locale}/feed.json radius options contain km or country text`, () => {
        const translations = loadTranslations(locale, 'feed')
        const filters = translations.filters as TranslationObject
        const location = filters.location as TranslationObject
        const radiusOptions = location.radiusOptions as TranslationObject

        // All numeric options should contain 'km' (Latin) or 'km' (Cyrillic)
        const numericKeys = ['1km', '5km', '10km', '25km', '50km']
        numericKeys.forEach((key) => {
          const value = radiusOptions[key] as string
          // Match either Latin 'km' or Cyrillic 'km' (used in RU/UK)
          expect(value).toMatch(/\d+\s*(km|км)/i)
        })
      })
    })
  })
})

// ===========================================================================
// FILE EXISTENCE
// ===========================================================================

describe('File Existence', () => {
  LOCALES.forEach((locale) => {
    NAMESPACES.forEach((namespace) => {
      it(`${locale}/${namespace}.json file exists`, () => {
        const filePath = path.join(
          process.cwd(),
          'src/lib/locales',
          locale,
          `${namespace}.json`
        )

        expect(fs.existsSync(filePath)).toBe(true)
      })
    })
  })
})
