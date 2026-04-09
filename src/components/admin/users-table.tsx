"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle2,
  XCircle,
  Eye,
  MoreHorizontal,
  Shield,
  Building2,
  User as UserIcon,
  Lock,
  Unlock
} from "lucide-react"
import { changeRoleAction } from "@/app/actions/admin/users/change-role"
import { toggleBlockAction } from "@/app/actions/admin/users/toggle-block"
import { toast } from "sonner"
import { Role } from "@prisma/client"
import { UserDetailsDialog } from "./user-details-dialog"

interface UsersTableProps {
  users: Array<{
    id: string
    email: string
    role: Role
    isBlocked: boolean
    emailVerified: Date | null
    createdAt: Date
  }>
  currentRole?: string
  currentStatus?: string
  currentSearch?: string
  currentUserId: string
}

export function UsersTable({
  users,
  currentRole,
  currentStatus,
  currentSearch,
  currentUserId
}: UsersTableProps) {
  const { t } = useTranslations("admin")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [search, setSearch] = useState(currentSearch || "")
  const [role, setRole] = useState(currentRole || "all")
  const [status, setStatus] = useState(currentStatus || "all")
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)

  const handleChangeRole = useCallback(async (userId: string, newRole: Role) => {
    if (!confirm(t("users.confirm.changeRole", { role: t(`users.role.${newRole}`) }))) return

    setIsLoading(userId)
    const result = await changeRoleAction(userId, newRole)

    if (!result.success) {
      toast.error(t(`errors.${result.error.split('.').pop()}`))
    } else {
      toast.success(t("users.success.roleChanged"))
    }

    setIsLoading(null)
  }, [t])

  const handleToggleBlock = useCallback(async (userId: string, block: boolean) => {
    const confirmKey = block ? "users.confirm.block" : "users.confirm.unblock"
    if (!confirm(t(confirmKey))) return

    setIsLoading(userId)
    const result = await toggleBlockAction(userId, block)

    if (!result.success) {
      toast.error(t(`errors.${result.error.split('.').pop()}`))
    } else {
      toast.success(t(block ? "users.success.blocked" : "users.success.unblocked"))
    }

    setIsLoading(null)
  }, [t])

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (role !== "all") params.set("role", role)
    if (status !== "all") params.set("status", status)
    router.push(`?${params.toString()}`)
  }, [search, role, status, router])

  const handleRoleFilterChange = useCallback((value: string) => {
    setRole(value)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value !== "all") params.set("role", value)
    if (status !== "all") params.set("status", status)
    router.push(`?${params.toString()}`)
  }, [search, status, router])

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatus(value)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (role !== "all") params.set("role", role)
    if (value !== "all") params.set("status", value)
    router.push(`?${params.toString()}`)
  }, [search, role, router])

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN": return <Shield className="h-3 w-3" />
      case "COMPANY": return <Building2 className="h-3 w-3" />
      default: return <UserIcon className="h-3 w-3" />
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case "ADMIN": return "destructive" as const
      case "COMPANY": return "default" as const
      default: return "secondary" as const
    }
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder={t("users.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />

        <Select value={role} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("users.filter.role")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filter.all")}</SelectItem>
            <SelectItem value="USER">{t("users.role.USER")}</SelectItem>
            <SelectItem value="COMPANY">{t("users.role.COMPANY")}</SelectItem>
            <SelectItem value="ADMIN">{t("users.role.ADMIN")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("users.filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filter.all")}</SelectItem>
            <SelectItem value="active">{t("users.filter.active")}</SelectItem>
            <SelectItem value="blocked">{t("users.filter.blocked")}</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>{t("users.search.button")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users.table.email")}</TableHead>
            <TableHead>{t("users.table.role")}</TableHead>
            <TableHead>{t("users.table.status")}</TableHead>
            <TableHead>{t("users.table.emailVerified")}</TableHead>
            <TableHead>{t("users.table.createdAt")}</TableHead>
            <TableHead>{t("users.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.email}
                {user.id === currentUserId && (
                  <Badge variant="outline" className="ml-2">Ty</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{t(`users.role.${user.role}`)}</span>
                </Badge>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                {user.emailVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailsUserId(user.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {user.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading === user.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "USER")}
                          disabled={user.role === "USER"}
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          {t("users.role.USER")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "COMPANY")}
                          disabled={user.role === "COMPANY"}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          {t("users.role.COMPANY")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "ADMIN")}
                          disabled={user.role === "ADMIN"}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {t("users.role.ADMIN")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isBlocked ? (
                          <DropdownMenuItem
                            onClick={() => handleToggleBlock(user.id, false)}
                          >
                            <Unlock className="mr-2 h-4 w-4" />
                            {t("users.actions.unblock")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleToggleBlock(user.id, true)}
                            className="text-destructive"
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            {t("users.actions.block")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDetailsDialog
        userId={detailsUserId}
        onClose={() => setDetailsUserId(null)}
      />
    </div>
  )
}
