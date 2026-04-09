"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  Folder,
  Utensils,
  Briefcase,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useSidebar } from "./sidebar-provider"
import type { CategoryWithChildren } from "@/app/actions/categories/get-categories"

// Map icon string names to Lucide icon components
const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
}

// Helper to get icon component from string name
function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Folder
  return iconMap[iconName] || Folder
}

interface SidebarCategoriesProps {
  locale: string
  categories: CategoryWithChildren[]
}

export function SidebarCategories({
  locale,
  categories,
}: SidebarCategoriesProps) {
  const pathname = usePathname()
  const { state, isMobile, close } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (categories.length === 0) {
    return null
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-1">
        {categories.map((category) => {
          const hasChildren = category.children.length > 0
          const categoryHref = `/${locale}/category/${category.slug}`
          const isActive = pathname.startsWith(categoryHref)
          const IconComponent = getCategoryIcon(category.icon)

          // Collapsed desktop: show icon with HoverCard for subcategories
          if (isCollapsed && !isMobile) {
            // With children: use HoverCard
            if (hasChildren) {
              return (
                <HoverCard key={category.id} openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={categoryHref}
                      className={cn(
                        "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="w-auto min-w-[180px] p-1"
                  >
                    {category.children.map((sub) => {
                      const SubIcon = getCategoryIcon(sub.icon)
                      return (
                        <Link
                          key={sub.id}
                          href={`/${locale}/category/${category.slug}/${sub.slug}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors"
                        >
                          <SubIcon className="h-4 w-4" />
                          {sub.name}
                        </Link>
                      )
                    })}
                  </HoverCardContent>
                </HoverCard>
              )
            }

            // Without children: use Tooltip
            return (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={categoryHref}
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {category.name}
                </TooltipContent>
              </Tooltip>
            )
          }

          // Expanded desktop or mobile: category without children - simple link
          if (!hasChildren) {
            return (
              <Link
                key={category.id}
                href={categoryHref}
                onClick={() => isMobile && close()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <IconComponent className="h-5 w-5 shrink-0" />
                <span className="truncate">{category.name}</span>
              </Link>
            )
          }

          // Expanded desktop or mobile: category with children - HoverCard on hover, click navigates to category
          return (
            <HoverCard key={category.id} openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Link
                  href={categoryHref}
                  onClick={() => isMobile && close()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <IconComponent className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-left">
                    {category.name}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                </Link>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-auto min-w-[180px] p-1"
              >
                {category.children.map((sub) => {
                  const subHref = `/${locale}/category/${category.slug}/${sub.slug}`
                  const SubIcon = getCategoryIcon(sub.icon)

                  return (
                    <Link
                      key={sub.id}
                      href={subHref}
                      onClick={() => isMobile && close()}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors"
                    >
                      <SubIcon className="h-4 w-4" />
                      {sub.name}
                    </Link>
                  )
                })}
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
