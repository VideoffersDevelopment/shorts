import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"

interface ViesStatusBadgeProps {
  status: "verified" | "pending_manual_review" | "rejected"
  className?: string
}

export function ViesStatusBadge({ status, className }: ViesStatusBadgeProps) {
  const { t } = useTranslations("companies")

  const config = {
    verified: {
      variant: "default" as const,
      icon: CheckCircle,
      label: t("vies.status.verified"),
      className: "bg-green-500 hover:bg-green-600"
    },
    pending_manual_review: {
      variant: "secondary" as const,
      icon: Clock,
      label: t("vies.status.pending"),
      className: "bg-yellow-500 hover:bg-yellow-600 text-black"
    },
    rejected: {
      variant: "destructive" as const,
      icon: XCircle,
      label: t("vies.status.rejected"),
      className: ""
    }
  }

  const { variant, icon: Icon, label, className: badgeClassName } = config[status]

  return (
    <Badge variant={variant} className={`${badgeClassName} ${className || ""}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
}
