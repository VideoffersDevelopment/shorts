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
import { CheckCircle2, XCircle, Eye } from "lucide-react"
import { verifyCompanyAction } from "@/app/actions/admin/companies/verify"
import { rejectCompanyAction } from "@/app/actions/admin/companies/reject"
import { toast } from "sonner"

interface CompaniesTableProps {
  companies: Array<{
    id: string
    companyName: string
    nip: string
    viesVerified: boolean
    createdAt: Date
    user: { email: string }
  }>
  currentStatus?: string
  currentSearch?: string
}

export function CompaniesTable({ companies, currentStatus, currentSearch }: CompaniesTableProps) {
  const { t } = useTranslations("admin")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [search, setSearch] = useState(currentSearch || "")
  const [status, setStatus] = useState(currentStatus || "all")

  const handleVerify = useCallback(async (companyId: string) => {
    setIsLoading(companyId)
    const result = await verifyCompanyAction(companyId)

    if (!result.success) {
      toast.error(t(`errors.${result.error.split('.').pop()}`))
    } else {
      toast.success(t("companies.verify.success"))
    }

    setIsLoading(null)
  }, [t])

  const handleReject = useCallback(async (companyId: string) => {
    const reason = prompt(t("companies.reject.reasonPrompt"))
    if (!reason) return

    setIsLoading(companyId)
    const result = await rejectCompanyAction(companyId, reason)

    if (!result.success) {
      toast.error(t(`errors.${result.error.split('.').pop()}`))
    } else {
      toast.success(t("companies.reject.success"))
    }

    setIsLoading(null)
  }, [t])

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    router.push(`?${params.toString()}`)
  }, [search, status, router])

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value !== "all") params.set("status", value)
    router.push(`?${params.toString()}`)
  }, [search, router])

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder={t("companies.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("companies.filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("companies.filter.all")}</SelectItem>
            <SelectItem value="verified">{t("companies.filter.verified")}</SelectItem>
            <SelectItem value="pending">{t("companies.filter.pending")}</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>{t("companies.search.button")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("companies.table.name")}</TableHead>
            <TableHead>{t("companies.table.nip")}</TableHead>
            <TableHead>{t("companies.table.email")}</TableHead>
            <TableHead>{t("companies.table.status")}</TableHead>
            <TableHead>{t("companies.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map(company => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">
                {company.companyName}
              </TableCell>
              <TableCell>{company.nip}</TableCell>
              <TableCell>{company.user.email}</TableCell>
              <TableCell>
                {company.viesVerified ? (
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t("companies.status.verified")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    {t("companies.status.pending")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {!company.viesVerified && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleVerify(company.id)}
                        disabled={isLoading === company.id}
                      >
                        {t("companies.actions.verify")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(company.id)}
                        disabled={isLoading === company.id}
                      >
                        {t("companies.actions.reject")}
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
