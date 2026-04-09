"use client"

import { useState } from "react"
import { Role } from "@prisma/client"
import { useTranslations } from "@/lib/i18n/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { User, Building2, Shield } from "lucide-react"

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRole: Role | null
  onConfirm: (newRole: Role) => void | Promise<void>
  title: string
  description: string
}

const roleOptions: { value: Role; icon: React.ReactNode }[] = [
  { value: "USER", icon: <User className="h-4 w-4" /> },
  { value: "COMPANY", icon: <Building2 className="h-4 w-4" /> },
  { value: "ADMIN", icon: <Shield className="h-4 w-4" /> },
]

export function ChangeRoleDialog({
  open,
  onOpenChange,
  currentRole,
  onConfirm,
  title,
  description,
}: ChangeRoleDialogProps) {
  const { t } = useTranslations("admin")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!selectedRole) return

    setIsLoading(true)
    try {
      await onConfirm(selectedRole)
    } finally {
      setIsLoading(false)
      setSelectedRole(null)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedRole(null)
    }
    onOpenChange(newOpen)
  }

  // Filter out current role from options
  const availableRoles = currentRole
    ? roleOptions.filter((opt) => opt.value !== currentRole)
    : roleOptions

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select
            value={selectedRole || undefined}
            onValueChange={(value) => setSelectedRole(value as Role)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("users.changeRole.selectRole")} />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{t(`users.role.${option.value}`)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRole || isLoading}
          >
            {isLoading ? t("common.saving") : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
