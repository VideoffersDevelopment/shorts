"use client"

import { useState, useCallback } from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { type CommentsListResponse } from "@/lib/types/interactions"
import { CommentForm } from "@/components/shorts/comment-form"
import { CommentItem } from "@/components/shorts/comment-item"

type SortOption = "newest" | "oldest" | "most_liked"

interface CommentsSectionTranslations {
  title: string
  count: string
  placeholder: string
  submit: string
  edit: string
  reply: string
  delete: string
  deleted: string
  edited: string
  editExpired: string
  loginRequired: string
  pending: string
  empty: string
  sortNewest: string
  sortOldest: string
  sortMostLiked: string
  charLimit: string
  loadMore: string
  confirmDelete: string
  deleteSuccess: string
  deleteFailed: string
  createFailed: string
  editFailed: string
}

interface CommentsSectionProps {
  shortId: string
  currentUserId: string | null
  isAdmin: boolean
  isAuthenticated: boolean
  translations: CommentsSectionTranslations
}

export function CommentsSection({
  shortId,
  currentUserId,
  isAdmin,
  isAuthenticated,
  translations: t,
}: CommentsSectionProps) {
  const [sort, setSort] = useState<SortOption>("newest")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyToName, setReplyToName] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<CommentsListResponse>({
    queryKey: ["comments", shortId, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/shorts/${shortId}/comments?sort=${sort}&page=${pageParam}&limit=20`
      )
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json() as Promise<CommentsListResponse>
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })

  const allComments = data?.pages.flatMap((page) => page.comments) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  const invalidateComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["comments", shortId] })
  }, [queryClient, shortId])

  const handleCreateComment = useCallback(
    async (content: string) => {
      try {
        const response = await fetch(`/api/shorts/${shortId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          toast.error(t.createFailed)
          return
        }

        invalidateComments()
      } catch {
        toast.error(t.createFailed)
      }
    },
    [shortId, t.createFailed, invalidateComments]
  )

  const handleCreateReply = useCallback(
    async (content: string) => {
      if (!replyToId) return

      try {
        const response = await fetch(`/api/shorts/${shortId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId: replyToId }),
        })

        if (!response.ok) {
          toast.error(t.createFailed)
          return
        }

        setReplyToId(null)
        setReplyToName(null)
        invalidateComments()
      } catch {
        toast.error(t.createFailed)
      }
    },
    [shortId, replyToId, t.createFailed, invalidateComments]
  )

  const handleReply = useCallback((parentId: string, authorName?: string) => {
    setReplyToId((prev) => {
      if (prev === parentId) {
        setReplyToName(null)
        return null
      }
      setReplyToName(authorName ?? null)
      return parentId
    })
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSort(value as SortOption)
  }, [])

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const titleWithCount = t.count.replace("%count%", String(totalCount))

  const commentItemTranslations = {
    reply: t.reply,
    edit: t.edit,
    delete: t.delete,
    deleted: t.deleted,
    edited: t.edited,
    editExpired: t.editExpired,
    pending: t.pending,
    confirmDelete: t.confirmDelete,
    deleteSuccess: t.deleteSuccess,
    deleteFailed: t.deleteFailed,
    editFailed: t.editFailed,
    placeholder: t.placeholder,
    submit: t.submit,
    charLimit: t.charLimit,
  }

  const formTranslations = {
    placeholder: t.placeholder,
    submit: t.submit,
    edit: t.edit,
    charLimit: t.charLimit,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          {t.title}
          {totalCount > 0 && <span className="text-muted-foreground font-normal">{totalCount}</span>}
        </h3>
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t.sortNewest}</SelectItem>
            <SelectItem value="oldest">{t.sortOldest}</SelectItem>
            <SelectItem value="most_liked">{t.sortMostLiked}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comment Form or Login Message */}
      {isAuthenticated ? (
        <CommentForm onSubmit={handleCreateComment} translations={formTranslations} />
      ) : (
        <p className="text-sm text-muted-foreground py-2">{t.loginRequired}</p>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-4">{t.createFailed}</p>
      ) : allComments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t.empty}</p>
      ) : (
        <div className="divide-y">
          {allComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                shortId={shortId}
                onReply={handleReply}
                onDeleted={invalidateComments}
                onEdited={invalidateComments}
                translations={commentItemTranslations}
              />
              {replyToId === comment.id && isAuthenticated && (
                <div className="ml-10 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {t.reply} {replyToName && (
                        <span className="font-medium">@{replyToName}</span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                      onClick={() => { setReplyToId(null); setReplyToName(null) }}
                    >
                      ✕
                    </Button>
                  </div>
                  <CommentForm
                    onSubmit={handleCreateReply}
                    translations={formTranslations}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {t.loadMore}
          </Button>
        </div>
      )}
    </div>
  )
}
