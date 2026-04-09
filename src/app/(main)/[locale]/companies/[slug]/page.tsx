import { notFound } from "next/navigation"
import { type Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CompanyPublicProfile } from "@/components/companies/company-public-profile"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const company = await prisma.companyProfile.findUnique({
    where: { slug: resolvedParams.slug },
    select: {
      companyName: true,
      description: true,
      banner: true,
      logo: true,
      status: true
    }
  })

  // Don't show metadata for non-existent or suspended companies
  if (!company || company.status === "SUSPENDED") return {}

  return {
    title: `${company.companyName} | VideoShorts`,
    description: company.description?.substring(0, 160) || "",
    openGraph: {
      title: company.companyName,
      description: company.description || "",
      images: company.banner || company.logo ? [company.banner || company.logo || ""] : []
    }
  }
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const resolvedParams = await params
  const session = await auth()

  const company = await prisma.companyProfile.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      category: true,
      user: {
        select: { id: true, email: true }
      }
    }
  })

  // Return 404 for non-existent or suspended companies
  if (!company || company.status === "SUSPENDED") {
    notFound()
  }

  // Check if current user is the owner of this company profile
  const isOwner = session?.user?.id === company.user.id

  // Fetch published shorts for this company
  const shorts = await prisma.short.findMany({
    where: {
      companyId: company.id,
      status: "PUBLISHED"
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      hlsPlaylistUrl: true,
      duration: true,
      stats: {
        select: {
          views: true,
          likes: true
        }
      }
    },
    orderBy: { publishedAt: "desc" },
    take: 12
  })

  return (
    <div className="container max-w-6xl py-8">
      <CompanyPublicProfile
        company={company}
        shorts={shorts}
        isOwner={isOwner}
        locale={resolvedParams.locale}
      />
    </div>
  )
}
