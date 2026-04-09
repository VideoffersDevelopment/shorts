import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({ adapter })

const email = process.argv[2] || 'noreply@condictor.pl'

async function main() {
  console.log(`🔍 Looking for user: ${email}`)

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true, role: true }
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log(`📋 Current role: ${user.role}`)

  if (user.role === 'ADMIN') {
    console.log('✅ User is already ADMIN')
    return
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' }
  })

  console.log(`✅ Updated to ADMIN: ${updated.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
