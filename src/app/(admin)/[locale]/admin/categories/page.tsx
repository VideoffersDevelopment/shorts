import { prisma } from "@/lib/prisma"
import { getText } from "@/lib/i18n/server"
import { type Locale } from "@/lib/i18n/config"
import { CategoriesTree } from "@/components/admin/categories-tree"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminCategoriesPage({ params }: PageProps) {
  const { locale } = await params
  const localeTyped = locale as Locale

  const categories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          _count: {
            select: { companyProfiles: true }
          }
        },
        orderBy: { order: "asc" }
      },
      _count: {
        select: { companyProfiles: true }
      }
    },
    orderBy: { order: "asc" }
  })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {await getText("title", "admin-categories", localeTyped)}
      </h1>

      <CategoriesTree categories={categories} />
    </div>
  )
}
