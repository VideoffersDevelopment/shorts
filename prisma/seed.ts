import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedCategories } from './seed-categories'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({ adapter })

// Default pricing configuration
const DEFAULT_PRICING = {
  PUBLICATION: { cost: 100, label: "Publikacja wideo", description: "Opłata za publikację nowego wideo", category: "publication", enabled: true },
  BOOST_STD: { cost: 80, label: "Boost Standard", description: "Promowanie wideo w feedzie (24h)", category: "boost", enabled: true },
  EXTENSION_30D: { cost: 500, label: "Przedłużenie +30 dni", description: "Przedłużenie emisji wideo o 30 dni", category: "extension", enabled: true },
  EXTENSION_3M: { cost: 1350, label: "Przedłużenie +3 miesiące", description: "Przedłużenie emisji wideo o 3 miesiące (10% rabat)", category: "extension", enabled: true },
  EXTENSION_6M: { cost: 2500, label: "Przedłużenie +6 miesięcy", description: "Przedłużenie emisji wideo o 6 miesięcy (~17% rabat)", category: "extension", enabled: true },
  EXTENSION_12M: { cost: 4500, label: "Przedłużenie +12 miesięcy", description: "Przedłużenie emisji wideo o 12 miesięcy (25% rabat)", category: "extension", enabled: true },
  SUPER_LIKE: { cost: 100, label: "Super Like", description: "Napiwek dla twórcy wideo", category: "interaction", enabled: true },
  MAINTENANCE_FEE: { cost: 500, label: "Opłata utrzymaniowa", description: "Miesięczna opłata za nieaktywne konto (auto)", category: "maintenance", enabled: true },
  WATERMARK_RM: { cost: 50, label: "Usunięcie znaku wodnego", description: "Jednorazowe usunięcie znaku wodnego z wideo", category: "utility", enabled: false },
  UPLOAD_4K: { cost: 100, label: "Upload 4K/60fps", description: "Jednorazowa opłata za upload w jakości 4K", category: "utility", enabled: false },
  LINK_BIO: { cost: 500, label: "Link w Bio (30 dni)", description: "Dodanie linku do profilu na 30 dni", category: "utility", enabled: false },
}

async function seedPricingConfig() {
  const count = await prisma.pricingConfig.count()

  if (count === 0) {
    const entries = Object.entries(DEFAULT_PRICING).map(([key, config]) => ({
      key,
      cost: config.cost,
      label: config.label,
      description: config.description,
      category: config.category,
      enabled: config.enabled
    }))

    await prisma.pricingConfig.createMany({
      data: entries
    })

    console.log(`✅ Created ${entries.length} pricing config entries`)
  } else {
    console.log('ℹ️ Pricing config already exists')
  }
}

async function main() {
  console.log('🌱 Starting seed...')

  // Seed admin user if needed
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@videoffers.com'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        role: 'ADMIN',
        emailVerified: new Date(),
        profile: {
          create: {
            displayName: 'Administrator'
          }
        }
      }
    })
    console.log('✅ Admin user created')
  } else {
    console.log('ℹ️ Admin user already exists')
  }

  // Seed categories
  await seedCategories()

  // Seed pricing config
  await seedPricingConfig()

  console.log('🌱 Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
