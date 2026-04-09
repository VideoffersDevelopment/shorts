import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { VideoUploadWizard } from "@/components/shorts/video-upload-wizard"

interface NewShortPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewShortPage({ params }: NewShortPageProps) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Check if user is a company
  if (session.user.role !== "COMPANY") {
    redirect(`/${locale}/panel`)
  }

  const t = await getTranslations("shorts")

  // Get company profile and verify it's active
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true }
  })

  if (!companyProfile) {
    redirect(`/${locale}/panel`)
  }

  if (companyProfile.status !== "ACTIVE") {
    // Company not verified yet
    redirect(`/${locale}/panel/company/profile`)
  }

  // Fetch categories for the form
  const categories = await prisma.category.findMany({
    where: {
      enabled: true,
      parentId: null // Only top-level categories
    },
    include: {
      children: {
        where: { enabled: true },
        orderBy: { order: "asc" }
      }
    },
    orderBy: { order: "asc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("create.title")}</h1>
        <p className="text-muted-foreground">{t("create.description")}</p>
      </div>

      <VideoUploadWizard categories={categories} locale={locale} />
    </div>
  )
}
