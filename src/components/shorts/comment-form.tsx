"use client"

import { useState, useCallback, type FormEvent, type ChangeEvent } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_CHARS = 500
const WARN_THRESHOLD = 450

interface CommentFormTranslations {
  placeholder: string
  submit: string
  edit: string
  charLimit: string
}

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  initialContent?: string
  isEditing?: boolean
  translations: CommentFormTranslations
  className?: string
}

export function CommentForm({
  onSubmit,
  initialContent = "",
  isEditing = false,
  translations: t,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)

  const charCount = content.length
  const isOverLimit = charCount > MAX_CHARS
  const isEmpty = content.trim().length === 0
  const isDisabled = isEmpty || isOverLimit || isLoading

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (isDisabled) return

      setIsLoading(true)
      try {
        await onSubmit(content.trim())
        if (!isEditing) {
          setContent("")
        }
      } finally {
        setIsLoading(false)
      }
    },
    [content, isDisabled, isEditing, onSubmit]
  )

  const charLabel = t.charLimit.replace("%count%", String(charCount))

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder={t.placeholder}
        maxLength={MAX_CHARS + 50}
        rows={3}
        className="min-h-[60px] resize-none"
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs text-muted-foreground",
            charCount > WARN_THRESHOLD && "text-red-500"
          )}
        >
          {charLabel}
        </span>
        <Button type="submit" size="sm" disabled={isDisabled}>
          {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {isEditing ? t.edit : t.submit}
        </Button>
      </div>
    </form>
  )
}
