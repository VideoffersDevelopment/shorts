import { prisma } from "@/lib/prisma"
import { getText } from "@/lib/i18n/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FolderTree, Clock } from "lucide-react"
import { type Locale } from "@/lib/i18n/config"

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { locale } = await params
  const localeTyped = locale as Locale

  // Fetch stats
  const [companiesCount, usersCount, categoriesCount, pendingCount] = await Promise.all([
    prisma.companyProfile.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.companyProfile.count({
      where: {
        viesVerified: false
      }
    })
  ])

  const stats = [
    {
      title: await getText("dashboard.stats.companies", "admin", localeTyped),
      value: companiesCount,
      icon: Building2
    },
    {
      title: await getText("dashboard.stats.users", "admin", localeTyped),
      value: usersCount,
      icon: Users
    },
    {
      title: await getText("dashboard.stats.categories", "admin", localeTyped),
      value: categoriesCount,
      icon: FolderTree
    },
    {
      title: `${pendingCount} ${await getText("dashboard.stats.pending", "admin", localeTyped)}`,
      value: pendingCount,
      icon: Clock
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {await getText("dashboard.title", "admin", localeTyped)}
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
