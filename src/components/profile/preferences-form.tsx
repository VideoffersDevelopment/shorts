"use client"

import * as React from "react"
import { useTranslations } from "@/lib/i18n/client"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { Button } from "@/components/ui/button"
import { updateProfileAction } from "@/app/actions/profile/update"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface PreferencesFormProps {
  locale: string
}

export function PreferencesForm({ locale }: PreferencesFormProps) {
  const { t } = useTranslations("preferences")
  const { theme } = useTheme()
  const [saving, setSaving] = React.useState(false)

  const handleSave = React.useCallback(async () => {
    setSaving(true)
    const darkMode = theme === "dark"
    const result = await updateProfileAction({ darkMode })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t("saved"))
    }
    setSaving(false)
  }, [theme, t])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("theme.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("theme.description")}
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">{t("language.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("language.description")}
        </p>
        <div className="mt-4">
          <LocaleSwitcher locale={locale} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </div>
  )
}
