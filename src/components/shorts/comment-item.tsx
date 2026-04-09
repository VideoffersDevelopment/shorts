"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { type CommentResponse } from "@/lib/types/interactions"
import { CommentForm } from "@/components/shorts/comment-form"

interface CommentItemTranslations {
  reply: string
  edit: string
  delete: string
  deleted: string
  edited: string
  editExpired: string
  pending: string
  confirmDelete: string
  deleteSuccess: string
  deleteFailed: string
  editFailed: string
  placeholder: string
  submit: string
  charLimit: string
}

interface CommentItemProps {
  comment: CommentResponse
  currentUserId: string | null
  isAdmin: boolean
  shortId: string
  onReply: (parentId: string, authorName?: string) => void
  onDeleted: () => void
  onEdited: () => void
  translations: CommentItemTranslations
  depth?: number
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const EDIT_WINDOW_MS = 15 * 60 * 1000

export function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  shortId,
  onReply,
  onDeleted,
  onEdited,
  translations: t,
  depth = 0,
}: CommentItemProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = currentUserId === comment.userId
  const isDeleted = comment.status === "DELETED"

  const canEdit = useMemo(() => {
    if (!isOwner || isDeleted) return false
    const elapsed = Date.now() - new Date(comment.createdAt).getTime()
    return elapsed < EDIT_WINDOW_MS
  }, [isOwner, isDeleted, comment.createdAt])

  const canDelete = (isOwner || isAdmin) && !isDeleted
  const canReply = depth === 0 && !isDeleted
  const showPending = isOwner && comment.status === "PENDING"

  const handleReply = useCallback(() => {
    onReply(comment.id, comment.user.displayName ?? undefined)
  }, [onReply, comment.id, comment.user.displayName])

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t.confirmDelete)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        toast.error(t.deleteFailed)
        return
      }

      toast.success(t.deleteSuccess)
      onDeleted()
    } catch {
      toast.error(t.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }, [comment.id, t.confirmDelete, t.deleteFailed, t.deleteSuccess, onDeleted])

  const handleEdit = useCallback(
    async (content: string) => {
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          toast.error(t.editFailed)
          return
        }

        setIsEditMode(false)
        onEdited()
      } catch {
        toast.error(t.editFailed)
      }
    },
    [comment.id, t.editFailed, onEdited]
  )

  const toggleEdit = useCallback(() => {
    setIsEditMode((prev) => !prev)
  }, [])

  const avatarFallback = comment.user.displayName?.charAt(0)?.toUpperCase() ?? "?"

  if (isDeleted) {
    return (
      <div className={cn("py-2 text-sm text-muted-foreground italic", depth > 0 && "ml-8")}>
        {t.deleted}
      </div>
    )
  }

  return (
    <div className={cn("py-3", depth > 0 && "ml-8")}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatar ? (
            <img
              src={comment.user.avatar}
              alt={comment.user.displayName ?? ""}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {avatarFallback}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">
              {comment.user.displayName ?? "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-muted-foreground italic">
                ({t.edited})
              </span>
            )}
            {showPending && (
              <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {t.pending}
              </span>
            )}
          </div>

          {isEditMode ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleEdit}
                initialContent={comment.content}
                isEditing
                translations={{
                  placeholder: t.placeholder,
                  submit: t.submit,
                  edit: t.edit,
                  charLimit: t.charLimit,
                }}
              />
            </div>
          ) : (
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditMode && (
            <div className="mt-1.5 flex items-center gap-1">
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={handleReply}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {t.reply}
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={toggleEdit}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {t.edit}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t.delete}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              shortId={shortId}
              onReply={onReply}
              onDeleted={onDeleted}
              onEdited={onEdited}
              translations={t}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
