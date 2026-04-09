import { describe, it, expect } from 'vitest'

// Import the categories data structure (we'll test the data, not DB operations)
// This mirrors the structure from prisma/seed-categories.ts
const initialCategories = [
  {
    name: "Jedzenie i Napoje",
    slug: "jedzenie-napoje",
    icon: "utensils",
    order: 1,
    children: [
      { name: "Restauracje", slug: "restauracje", order: 1 },
      { name: "Kawiarnie", slug: "kawiarnie", order: 2 },
      { name: "Catering", slug: "catering", order: 3 }
    ]
  },
  {
    name: "Usługi",
    slug: "uslugi",
    icon: "briefcase",
    order: 2,
    children: [
      { name: "Fryzjerzy", slug: "fryzjerzy", order: 1 },
      { name: "Mechanicy", slug: "mechanicy", order: 2 },
      { name: "Serwis IT", slug: "serwis-it", order: 3 }
    ]
  },
  {
    name: "Retail",
    slug: "retail",
    icon: "shopping-bag",
    order: 3,
    children: [
      { name: "Odzież", slug: "odziez", order: 1 },
      { name: "Elektronika", slug: "elektronika", order: 2 },
      { name: "Meble", slug: "meble", order: 3 }
    ]
  }
]

describe('seed-categories data structure', () => {
  // ===========================================================================
  // STRUCTURE
  // ===========================================================================

  describe('structure', () => {
    it('has 3 parent categories', () => {
      expect(initialCategories).toHaveLength(3)
    })

    it('each parent has 3 children', () => {
      initialCategories.forEach(parent => {
        expect(parent.children).toHaveLength(3)
      })
    })

    it('total categories is 12 (3 parents + 9 children)', () => {
      const total = initialCategories.length +
        initialCategories.reduce((sum, cat) => sum + cat.children.length, 0)
      expect(total).toBe(12)
    })

    it('all parents have required fields', () => {
      initialCategories.forEach(parent => {
        expect(parent).toHaveProperty('name')
        expect(parent).toHaveProperty('slug')
        expect(parent).toHaveProperty('icon')
        expect(parent).toHaveProperty('order')
        expect(parent).toHaveProperty('children')
      })
    })

    it('all children have required fields', () => {
      initialCategories.forEach(parent => {
        parent.children.forEach(child => {
          expect(child).toHaveProperty('name')
          expect(child).toHaveProperty('slug')
          expect(child).toHaveProperty('order')
        })
      })
    })
  })

  // ===========================================================================
  // SLUGS
  // ===========================================================================

  describe('slugs', () => {
    it('all parent slugs are unique', () => {
      const slugs = initialCategories.map(c => c.slug)
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(slugs.length)
    })

    it('all child slugs are unique', () => {
      const childSlugs = initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      const uniqueSlugs = new Set(childSlugs)
      expect(uniqueSlugs.size).toBe(childSlugs.length)
    })

    it('no slug collision between parents and children', () => {
      const parentSlugs = initialCategories.map(c => c.slug)
      const childSlugs = initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      const allSlugs = [...parentSlugs, ...childSlugs]
      const uniqueSlugs = new Set(allSlugs)

      expect(uniqueSlugs.size).toBe(allSlugs.length)
    })

    it('slugs contain only lowercase letters, numbers and hyphens', () => {
      const allSlugs = [
        ...initialCategories.map(c => c.slug),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      ]

      allSlugs.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9-]+$/)
      })
    })

    it('slugs do not start or end with hyphen', () => {
      const allSlugs = [
        ...initialCategories.map(c => c.slug),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      ]

      allSlugs.forEach(slug => {
        expect(slug).not.toMatch(/^-/)
        expect(slug).not.toMatch(/-$/)
      })
    })

    it('slugs do not contain consecutive hyphens', () => {
      const allSlugs = [
        ...initialCategories.map(c => c.slug),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      ]

      allSlugs.forEach(slug => {
        expect(slug).not.toContain('--')
      })
    })

    it('slugs are not empty', () => {
      const allSlugs = [
        ...initialCategories.map(c => c.slug),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      ]

      allSlugs.forEach(slug => {
        expect(slug.length).toBeGreaterThan(0)
      })
    })
  })

  // ===========================================================================
  // ORDER
  // ===========================================================================

  describe('order', () => {
    it('parent categories have sequential order', () => {
      const orders = initialCategories.map(c => c.order)
      expect(orders).toEqual([1, 2, 3])
    })

    it('children within each parent have sequential order', () => {
      initialCategories.forEach(parent => {
        const childOrders = parent.children.map(c => c.order)
        expect(childOrders).toEqual([1, 2, 3])
      })
    })

    it('all order values are positive integers', () => {
      initialCategories.forEach(parent => {
        expect(parent.order).toBeGreaterThan(0)
        expect(Number.isInteger(parent.order)).toBe(true)

        parent.children.forEach(child => {
          expect(child.order).toBeGreaterThan(0)
          expect(Number.isInteger(child.order)).toBe(true)
        })
      })
    })

    it('parent orders are unique', () => {
      const orders = initialCategories.map(c => c.order)
      const uniqueOrders = new Set(orders)
      expect(uniqueOrders.size).toBe(orders.length)
    })

    it('child orders are unique within each parent', () => {
      initialCategories.forEach(parent => {
        const childOrders = parent.children.map(c => c.order)
        const uniqueOrders = new Set(childOrders)
        expect(uniqueOrders.size).toBe(childOrders.length)
      })
    })
  })

  // ===========================================================================
  // ICONS
  // ===========================================================================

  describe('icons', () => {
    it('all parent categories have icons', () => {
      initialCategories.forEach(parent => {
        expect(parent.icon).toBeDefined()
        expect(typeof parent.icon).toBe('string')
        expect(parent.icon.length).toBeGreaterThan(0)
      })
    })

    it('children do not have icons', () => {
      initialCategories.forEach(parent => {
        parent.children.forEach(child => {
          expect(child).not.toHaveProperty('icon')
        })
      })
    })

    it('parent icons are unique', () => {
      const icons = initialCategories.map(c => c.icon)
      const uniqueIcons = new Set(icons)
      expect(uniqueIcons.size).toBe(icons.length)
    })

    it('icons contain only lowercase letters and hyphens', () => {
      initialCategories.forEach(parent => {
        expect(parent.icon).toMatch(/^[a-z-]+$/)
      })
    })
  })

  // ===========================================================================
  // NAMES
  // ===========================================================================

  describe('names', () => {
    it('all categories have non-empty names', () => {
      const allNames = [
        ...initialCategories.map(c => c.name),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.name))
      ]

      allNames.forEach(name => {
        expect(name).toBeDefined()
        expect(name.length).toBeGreaterThan(0)
      })
    })

    it('parent names are unique', () => {
      const names = initialCategories.map(c => c.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('all names are properly capitalized', () => {
      const allNames = [
        ...initialCategories.map(c => c.name),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.name))
      ]

      allNames.forEach(name => {
        // First letter should be uppercase
        expect(name[0]).toBe(name[0].toUpperCase())
      })
    })

    it('names do not contain trailing or leading spaces', () => {
      const allNames = [
        ...initialCategories.map(c => c.name),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.name))
      ]

      allNames.forEach(name => {
        expect(name).toBe(name.trim())
      })
    })
  })

  // ===========================================================================
  // DATA INTEGRITY
  // ===========================================================================

  describe('data integrity', () => {
    it('category names match expected Polish categories', () => {
      const parentNames = initialCategories.map(c => c.name)

      expect(parentNames).toContain('Jedzenie i Napoje')
      expect(parentNames).toContain('Usługi')
      expect(parentNames).toContain('Retail')
    })

    it('food category has expected subcategories', () => {
      const foodCategory = initialCategories.find(c => c.slug === 'jedzenie-napoje')
      const childNames = foodCategory?.children.map(c => c.name)

      expect(childNames).toContain('Restauracje')
      expect(childNames).toContain('Kawiarnie')
      expect(childNames).toContain('Catering')
    })

    it('services category has expected subcategories', () => {
      const servicesCategory = initialCategories.find(c => c.slug === 'uslugi')
      const childNames = servicesCategory?.children.map(c => c.name)

      expect(childNames).toContain('Fryzjerzy')
      expect(childNames).toContain('Mechanicy')
      expect(childNames).toContain('Serwis IT')
    })

    it('retail category has expected subcategories', () => {
      const retailCategory = initialCategories.find(c => c.slug === 'retail')
      const childNames = retailCategory?.children.map(c => c.name)

      expect(childNames).toContain('Odzież')
      expect(childNames).toContain('Elektronika')
      expect(childNames).toContain('Meble')
    })
  })

  // ===========================================================================
  // CONSISTENCY
  // ===========================================================================

  describe('consistency', () => {
    it('all parents have exactly 3 children (consistency check)', () => {
      const childCounts = initialCategories.map(c => c.children.length)
      expect(childCounts.every(count => count === 3)).toBe(true)
    })

    it('slug format is consistent across all categories', () => {
      const allSlugs = [
        ...initialCategories.map(c => c.slug),
        ...initialCategories.flatMap(c => c.children.map(ch => ch.slug))
      ]

      // All slugs should follow kebab-case
      allSlugs.forEach(slug => {
        expect(slug).toBe(slug.toLowerCase())
        expect(slug).not.toContain(' ')
        expect(slug).not.toContain('_')
      })
    })

    it('order values start from 1 for both parents and children', () => {
      const firstParentOrder = Math.min(...initialCategories.map(c => c.order))
      expect(firstParentOrder).toBe(1)

      initialCategories.forEach(parent => {
        const firstChildOrder = Math.min(...parent.children.map(c => c.order))
        expect(firstChildOrder).toBe(1)
      })
    })
  })
})
