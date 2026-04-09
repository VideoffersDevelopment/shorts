import { prisma } from "@/lib/prisma"
import { PricingTable } from "@/components/admin/pricing-table"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

interface AdminPricingPageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminPricingPage({ params }: AdminPricingPageProps) {
  await params

  const pricing = await prisma.pricingConfig.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  })

  // Group by category
  const grouped = pricing.reduce<Record<string, typeof pricing>>((acc, item) => {
    const cat = item.category || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    publication: "Publication",
    boost: "Boost",
    extension: "Extension",
    interaction: "Interaction",
    maintenance: "Maintenance",
    utility: "Utility",
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <DollarSign className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Pricing Configuration</h1>
      </div>

      <p className="mb-8 text-muted-foreground">
        Manage service costs and availability. Click &quot;Edit&quot; to modify values inline. Changes take effect immediately.
      </p>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <PricingTable
            key={category}
            items={items.map(i => ({
              key: i.key,
              label: i.label,
              description: i.description,
              cost: i.cost,
              enabled: i.enabled,
              category: i.category,
            }))}
            category={category}
            categoryLabel={categoryLabels[category] || category}
          />
        ))}
      </div>

      {pricing.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pricing configuration found. Run the seed to populate defaults.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
