"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface PricingItem {
  key: string
  label: string
  description: string | null
  cost: number
  enabled: boolean
  category: string | null
}

interface PricingTableProps {
  items: PricingItem[]
  category: string
  categoryLabel: string
}

interface EditState {
  key: string
  cost: number
  enabled: boolean
}

export function PricingTable({ items, category, categoryLabel }: PricingTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<EditState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startEdit = useCallback((item: PricingItem) => {
    setEditing({ key: item.key, cost: item.cost, enabled: item.enabled })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditing(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editing) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editing.key,
          cost: editing.cost,
          enabled: editing.enabled
        })
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to update pricing")
        return
      }

      toast.success(`${editing.key} updated`)
      setEditing(null)
      router.refresh()
    } catch {
      toast.error("Failed to update pricing")
    } finally {
      setIsLoading(false)
    }
  }, [editing, router])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{categoryLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Key</th>
                <th className="pb-2 font-medium">Label</th>
                <th className="pb-2 font-medium">Cost (pts)</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editing?.key === item.key
                return (
                  <tr key={item.key} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{item.key}</td>
                    <td className="py-3">{item.label}</td>
                    <td className="py-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editing.cost}
                          onChange={(e) =>
                            setEditing({ ...editing, cost: parseInt(e.target.value) || 0 })
                          }
                          className="w-28 h-8"
                          disabled={isLoading}
                        />
                      ) : (
                        <span className="font-bold">{item.cost.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {isEditing ? (
                        <Switch
                          checked={editing.enabled}
                          onCheckedChange={(checked) =>
                            setEditing({ ...editing, enabled: checked })
                          }
                          disabled={isLoading}
                        />
                      ) : (
                        <Badge variant={item.enabled ? "default" : "secondary"}>
                          {item.enabled ? "Active" : "Disabled"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                      {item.description}
                    </td>
                    <td className="py-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveEdit}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          disabled={editing !== null}
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
