"use client"

import { Eye, Heart, MapPin, BadgeCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface VideoCardProps {
  id: string
  title: string
  thumbnailUrl: string
  views?: number
  likes?: number
  location?: string
  distance?: string
  company: {
    name: string
    slug: string
    logoUrl?: string
    verified?: boolean
  }
  ctaText?: string
  ctaVariant?: "primary" | "secondary"
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  }
  return num.toString()
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  views,
  likes,
  location,
  distance,
  company,
  ctaText,
  ctaVariant = "primary",
}: VideoCardProps) {
  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-0 bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer">
      <div className="block">
        <div className="relative w-full aspect-[9/16] bg-muted overflow-hidden">
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

          {/* Stats Badge */}
          {(views || likes) && (
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5">
              {views && (
                <>
                  <Eye className="h-3.5 w-3.5 text-white" />
                  <span className="text-white text-xs font-bold">
                    {formatNumber(views)}
                  </span>
                </>
              )}
              {likes && !views && (
                <>
                  <Heart className="h-3.5 w-3.5 text-white" />
                  <span className="text-white text-xs font-bold">
                    {formatNumber(likes)}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Card Content */}
          <CardContent className="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-3">
            {/* Title & Location */}
            <div className="flex flex-col gap-0.5">
              <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                {title}
              </h3>
              {(location || distance) && (
                <div className="flex items-center gap-1 text-gray-300 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {location}
                    {distance && ` • ${distance}`}
                  </span>
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={company.logoUrl} alt={company.name} />
                <AvatarFallback className="text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium truncate flex-1 flex items-center gap-1">
                {company.name}
                {company.verified && (
                  <BadgeCheck className="h-4 w-4 text-blue-400 fill-blue-400" />
                )}
              </span>
            </div>

            {/* CTA Button */}
            {ctaText && (
              <Button
                variant={ctaVariant === "primary" ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "w-full mt-1",
                  ctaVariant === "secondary" &&
                    "bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/10"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {ctaText}
              </Button>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
