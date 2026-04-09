import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({ adapter })

interface CategoryChild {
  name: string
  slug: string
  order: number
}

interface CategoryWithChildren {
  name: string
  slug: string
  icon: string
  order: number
  children: CategoryChild[]
}

const initialCategories: CategoryWithChildren[] = [
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

export async function seedCategories() {
  console.log('🏷️ Seeding categories...')

  for (const categoryData of initialCategories) {
    // Check if parent category exists
    const existingParent = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    })

    let parentId: string

    if (!existingParent) {
      // Create parent category
      const parent = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          icon: categoryData.icon,
          order: categoryData.order,
          enabled: true
        }
      })
      parentId = parent.id
      console.log(`✅ Created parent category: ${categoryData.name}`)
    } else {
      parentId = existingParent.id
      console.log(`ℹ️ Parent category already exists: ${categoryData.name}`)
    }

    // Create child categories
    for (const childData of categoryData.children) {
      const existingChild = await prisma.category.findUnique({
        where: { slug: childData.slug }
      })

      if (!existingChild) {
        await prisma.category.create({
          data: {
            name: childData.name,
            slug: childData.slug,
            order: childData.order,
            enabled: true,
            parentId
          }
        })
        console.log(`  ✅ Created child category: ${childData.name}`)
      } else {
        console.log(`  ℹ️ Child category already exists: ${childData.name}`)
      }
    }
  }

  const totalCategories = await prisma.category.count()
  console.log(`✅ Categories seeded. Total: ${totalCategories}`)
}
