"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  name: string
  slug: string
}

interface CategoryBreadcrumbProps {
  items: BreadcrumbItem[]
  locale: string
}

export function CategoryBreadcrumb({ items, locale }: CategoryBreadcrumbProps) {
  // Build the href progressively: /locale/category/parent/child
  const buildHref = (index: number) => {
    const slugPath = items.slice(0, index + 1).map(i => i.slug).join('/')
    return `/${locale}/category/${slugPath}`
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        href={`/${locale}`}
        className="hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.slug} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">{item.name}</span>
            ) : (
              <Link
                href={buildHref(index)}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
