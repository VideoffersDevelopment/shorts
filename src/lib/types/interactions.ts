import type { LikeType, CommentStatus } from "@prisma/client"

export interface LikeResponse {
  liked: boolean
  type: LikeType | null
  counts: Partial<Record<LikeType, number>>
  totalLikes: number
}

export interface CommentUser {
  id: string
  displayName: string | null
  avatar: string | null
}

export interface CommentResponse {
  id: string
  userId: string
  content: string
  status: CommentStatus
  parentId: string | null
  createdAt: string
  editedAt: string | null
  user: CommentUser
  replies: CommentResponse[]
}

export interface CommentsListResponse {
  comments: CommentResponse[]
  totalCount: number
  page: number
  hasMore: boolean
}

export interface FollowResponse {
  following: boolean
  followersCount: number
}

export interface FollowedCompany {
  id: string
  companyName: string
  slug: string
  logo: string | null
  viesVerified: boolean
  followersCount: number
  shortsCount: number
}

export interface FollowingListResponse {
  companies: FollowedCompany[]
  totalCount: number
  page: number
  hasMore: boolean
}
