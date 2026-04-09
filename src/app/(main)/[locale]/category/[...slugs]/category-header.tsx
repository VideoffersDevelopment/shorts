"use client"

import { CategoryBreadcrumb } from "./category-breadcrumb"

interface CategoryHeaderProps {
  breadcrumb: { name: string; slug: string }[]
  locale: string
  categoryName: string
  categorySlug: string
  subcategories: { id: string; name: string; slug: string }[]
}

export function CategoryHeader({
  breadcrumb,
  locale,
  categoryName,
  categorySlug,
  subcategories,
}: CategoryHeaderProps) {
  return (
    <div className="space-y-1.5">
      <CategoryBreadcrumb items={breadcrumb} locale={locale} />
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold leading-tight">{categoryName}</h1>
        {subcategories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {subcategories.map((sub) => (
              <a
                key={sub.id}
                href={`/${locale}/category/${categorySlug}/${sub.slug}`}
                className="shrink-0 px-2.5 py-1 rounded-full border text-xs hover:bg-accent transition-colors"
              >
                {sub.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
