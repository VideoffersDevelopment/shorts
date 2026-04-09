"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getUserDetailsAction,
  type UserDetails
} from "@/app/actions/admin/users/get-user-details"
import {
  CheckCircle2,
  XCircle,
  Shield,
  Building2,
  User as UserIcon,
  Lock,
  Unlock,
  Mail,
  Calendar,
  MapPin,
  ExternalLink
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface UserDetailsDialogProps {
  userId: string | null
  onClose: () => void
}

export function UserDetailsDialog({ userId, onClose }: UserDetailsDialogProps) {
  const { t } = useTranslations("admin")
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setUser(null)
      return
    }

    const fetchDetails = async () => {
      setIsLoading(true)
      const result = await getUserDetailsAction(userId)
      if (result.success) {
        setUser(result.data)
      }
      setIsLoading(false)
    }

    fetchDetails()
  }, [userId])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Shield className="h-4 w-4" />
      case "COMPANY": return <Building2 className="h-4 w-4" />
      default: return <UserIcon className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN": return "destructive" as const
      case "COMPANY": return "default" as const
      default: return "secondary" as const
    }
  }

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("users.details.title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile?.avatar || undefined} />
                <AvatarFallback className="text-lg">
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                {user.profile?.displayName && (
                  <p className="font-semibold text-lg">{user.profile.displayName}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleIcon(user.role)}
                <span className="ml-1">{t(`users.role.${user.role}`)}</span>
              </Badge>

              {user.isBlocked ? (
                <Badge variant="destructive">
                  <Lock className="mr-1 h-3 w-3" />
                  {t("users.status.blocked")}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Unlock className="mr-1 h-3 w-3" />
                  {t("users.status.active")}
                </Badge>
              )}

              {user.emailVerified ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("users.details.emailVerified")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <XCircle className="mr-1 h-3 w-3" />
                  {t("users.details.emailVerified")}
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("users.details.createdAt")}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("users.details.updatedAt")}</span>
                <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
              {user.profile?.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lokalizacja</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {user.profile.location}
                  </span>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.profile?.bio && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="text-sm">{user.profile.bio}</p>
                </div>
              </>
            )}

            {/* Company profile */}
            {user.companyProfile ? (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("users.details.companyProfile")}
                  </p>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{user.companyProfile.companyName}</span>
                      {user.companyProfile.viesVerified ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          VIES
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Oczekuje
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">NIP: {user.companyProfile.nip}</p>
                    <a
                      href={`/companies/${user.companyProfile.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      Zobacz profil firmy
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              user.role === "COMPANY" && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground italic">
                    {t("users.details.noCompanyProfile")}
                  </p>
                </>
              )
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
