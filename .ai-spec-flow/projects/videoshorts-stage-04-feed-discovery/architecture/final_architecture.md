# Architecture: Feed + Discovery (Stage 4)

**Project:** videoshorts-stage-04-feed-discovery
**Iteration:** v1
**Date:** 2026-01-01

---

## 1. Frontend Specification

### 1.1 Navigation Updates

This feature is **PUBLIC** (home page) - not a panel feature.

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/layout/header.tsx` | Add SearchBar component with autocomplete |
| `src/components/layout/main-sidebar.tsx` | No changes (feed is home page, not sidebar) |
| `src/app/(main)/[locale]/page.tsx` | Convert from static to dynamic feed |

**Header Integration:**

```typescript
// src/components/layout/header.tsx
// Add SearchBar between logo and user menu
<header className="sticky top-0 z-50 ...">
  <Logo />
  <SearchBar className="flex-1 max-w-xl mx-4" />  {/* NEW */}
  <SortDropdown />                                  {/* NEW */}
  <FilterButton />                                  {/* NEW - mobile */}
  <UserMenu />
</header>
```

---

### 1.2 Routing Design

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/[locale]` | `src/app/(main)/[locale]/page.tsx` | Server Component | Home feed (MODIFY) |
| `/[locale]/search` | `src/app/(main)/[locale]/search/page.tsx` | Server Component | Search results (CREATE) |
| `/[locale]/shorts/[id]` | `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Server Component | Public short detail (CREATE) |

**Page Structure:**

```typescript
// src/app/(main)/[locale]/page.tsx (MODIFY - convert from static to dynamic)
export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params
  const filters = parseSearchParams(searchParams)

  // Initial server-side fetch
  const initialData = await getFeedData(filters)

  return (
    <div className="flex flex-col gap-8">
      <CategoryFilter />
      <SortDropdown />
      <FeedGrid initialData={initialData} filters={filters} />
    </div>
  )
}
```

```typescript
// src/app/(main)/[locale]/search/page.tsx (CREATE)
export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const query = searchParams.q as string
  const type = searchParams.type as 'all' | 'shorts' | 'companies' | undefined

  const results = await searchContent(query, type)

  return (
    <div>
      <SearchHeader query={query} />
      <SearchTabs activeTab={type ?? 'all'} />
      <SearchResults results={results} />
    </div>
  )
}
```

```typescript
// src/app/(main)/[locale]/shorts/[id]/page.tsx (CREATE)
export default async function ShortDetailPage({ params }: Props) {
  const { id } = await params
  const short = await getPublicShort(id)

  if (!short) notFound()

  return (
    <ShortDetailView short={short} />
  )
}
```

---

### 1.3 Translation Keys (All 6 Languages)

**New Namespaces:**

#### feed.json

**Polish (pl):**
```json
{
  "sort": {
    "label": "Sortuj",
    "algorithmic": "Dla Ciebie",
    "newest": "Najnowsze",
    "popular": "Popularne",
    "trending": "Na czasie",
    "following": "Obserwowane"
  },
  "filters": {
    "title": "Filtry",
    "apply": "Zastosuj filtry",
    "clear": "Wyczysc wszystkie",
    "location": {
      "label": "Lokalizacja",
      "radius": "Promien",
      "detectLocation": "Wykryj lokalizacje",
      "wholeCountry": "Caly kraj",
      "nearMe": "W poblizu ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Caly kraj"
      }
    },
    "categories": {
      "label": "Kategorie",
      "placeholder": "Wybierz kategorie...",
      "maxSelected": "Maksymalnie {max} kategorii"
    },
    "tags": {
      "label": "Tagi",
      "placeholder": "Szukaj tagow..."
    },
    "verifiedOnly": {
      "label": "Tylko zweryfikowane",
      "description": "Pokaz tylko shorty od zweryfikowanych firm"
    },
    "activeFilters": "Aktywne filtry: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Brak shortow w tym obszarze",
      "description": "Sprobuj rozszerzyc promien lub zmienic filtry",
      "expandRadius": "Rozszerz promien",
      "clearFilters": "Usun filtry",
      "browseAll": "Przegladaj wszystkie"
    },
    "noFollowing": {
      "title": "Nie obserwujesz jeszcze zadnych firm",
      "description": "Odkryj lokalne firmy i zacznij obserwowac",
      "discoverCta": "Odkryj firmy"
    }
  },
  "loading": {
    "more": "Ladowanie wiecej...",
    "skeleton": "Ladowanie shortow..."
  },
  "card": {
    "views": "{count} wyswietlen",
    "likes": "{count} polubien",
    "distance": "{distance} od Ciebie"
  }
}
```

**English (en):**
```json
{
  "sort": {
    "label": "Sort",
    "algorithmic": "For You",
    "newest": "Newest",
    "popular": "Popular",
    "trending": "Trending",
    "following": "Following"
  },
  "filters": {
    "title": "Filters",
    "apply": "Apply filters",
    "clear": "Clear all",
    "location": {
      "label": "Location",
      "radius": "Radius",
      "detectLocation": "Detect location",
      "wholeCountry": "Whole country",
      "nearMe": "Near me ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Whole country"
      }
    },
    "categories": {
      "label": "Categories",
      "placeholder": "Select categories...",
      "maxSelected": "Maximum {max} categories"
    },
    "tags": {
      "label": "Tags",
      "placeholder": "Search tags..."
    },
    "verifiedOnly": {
      "label": "Verified only",
      "description": "Show only shorts from verified companies"
    },
    "activeFilters": "Active filters: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "No shorts in this area",
      "description": "Try expanding the radius or changing filters",
      "expandRadius": "Expand radius",
      "clearFilters": "Clear filters",
      "browseAll": "Browse all"
    },
    "noFollowing": {
      "title": "You don't follow any companies yet",
      "description": "Discover local businesses and start following",
      "discoverCta": "Discover companies"
    }
  },
  "loading": {
    "more": "Loading more...",
    "skeleton": "Loading shorts..."
  },
  "card": {
    "views": "{count} views",
    "likes": "{count} likes",
    "distance": "{distance} away"
  }
}
```

**German (de):**
```json
{
  "sort": {
    "label": "Sortieren",
    "algorithmic": "Fur dich",
    "newest": "Neueste",
    "popular": "Beliebt",
    "trending": "Im Trend",
    "following": "Gefolgt"
  },
  "filters": {
    "title": "Filter",
    "apply": "Filter anwenden",
    "clear": "Alle loschen",
    "location": {
      "label": "Standort",
      "radius": "Radius",
      "detectLocation": "Standort erkennen",
      "wholeCountry": "Ganzes Land",
      "nearMe": "In der Nahe ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Ganzes Land"
      }
    },
    "categories": {
      "label": "Kategorien",
      "placeholder": "Kategorien auswahlen...",
      "maxSelected": "Maximal {max} Kategorien"
    },
    "tags": {
      "label": "Tags",
      "placeholder": "Tags suchen..."
    },
    "verifiedOnly": {
      "label": "Nur verifizierte",
      "description": "Nur Shorts von verifizierten Unternehmen anzeigen"
    },
    "activeFilters": "Aktive Filter: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Keine Shorts in diesem Bereich",
      "description": "Versuche den Radius zu erweitern oder Filter zu andern",
      "expandRadius": "Radius erweitern",
      "clearFilters": "Filter loschen",
      "browseAll": "Alle durchsuchen"
    },
    "noFollowing": {
      "title": "Du folgst noch keinen Unternehmen",
      "description": "Entdecke lokale Unternehmen und beginne zu folgen",
      "discoverCta": "Unternehmen entdecken"
    }
  },
  "loading": {
    "more": "Mehr laden...",
    "skeleton": "Shorts laden..."
  },
  "card": {
    "views": "{count} Aufrufe",
    "likes": "{count} Likes",
    "distance": "{distance} entfernt"
  }
}
```

**Spanish (es):**
```json
{
  "sort": {
    "label": "Ordenar",
    "algorithmic": "Para ti",
    "newest": "Mas recientes",
    "popular": "Populares",
    "trending": "Tendencias",
    "following": "Siguiendo"
  },
  "filters": {
    "title": "Filtros",
    "apply": "Aplicar filtros",
    "clear": "Borrar todos",
    "location": {
      "label": "Ubicacion",
      "radius": "Radio",
      "detectLocation": "Detectar ubicacion",
      "wholeCountry": "Todo el pais",
      "nearMe": "Cerca de mi ({distance})",
      "radiusOptions": {
        "1km": "1 km",
        "5km": "5 km",
        "10km": "10 km",
        "25km": "25 km",
        "50km": "50 km",
        "all": "Todo el pais"
      }
    },
    "categories": {
      "label": "Categorias",
      "placeholder": "Seleccionar categorias...",
      "maxSelected": "Maximo {max} categorias"
    },
    "tags": {
      "label": "Etiquetas",
      "placeholder": "Buscar etiquetas..."
    },
    "verifiedOnly": {
      "label": "Solo verificados",
      "description": "Mostrar solo shorts de empresas verificadas"
    },
    "activeFilters": "Filtros activos: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "No hay shorts en esta area",
      "description": "Intenta ampliar el radio o cambiar los filtros",
      "expandRadius": "Ampliar radio",
      "clearFilters": "Borrar filtros",
      "browseAll": "Explorar todos"
    },
    "noFollowing": {
      "title": "Aun no sigues a ninguna empresa",
      "description": "Descubre negocios locales y empieza a seguir",
      "discoverCta": "Descubrir empresas"
    }
  },
  "loading": {
    "more": "Cargando mas...",
    "skeleton": "Cargando shorts..."
  },
  "card": {
    "views": "{count} vistas",
    "likes": "{count} me gusta",
    "distance": "a {distance}"
  }
}
```

**Russian (ru):**
```json
{
  "sort": {
    "label": "Сортировка",
    "algorithmic": "Для вас",
    "newest": "Новые",
    "popular": "Популярные",
    "trending": "В тренде",
    "following": "Подписки"
  },
  "filters": {
    "title": "Фильтры",
    "apply": "Применить фильтры",
    "clear": "Очистить все",
    "location": {
      "label": "Местоположение",
      "radius": "Радиус",
      "detectLocation": "Определить местоположение",
      "wholeCountry": "Вся страна",
      "nearMe": "Рядом ({distance})",
      "radiusOptions": {
        "1km": "1 км",
        "5km": "5 км",
        "10km": "10 км",
        "25km": "25 км",
        "50km": "50 км",
        "all": "Вся страна"
      }
    },
    "categories": {
      "label": "Категории",
      "placeholder": "Выберите категории...",
      "maxSelected": "Максимум {max} категорий"
    },
    "tags": {
      "label": "Теги",
      "placeholder": "Поиск тегов..."
    },
    "verifiedOnly": {
      "label": "Только проверенные",
      "description": "Показывать только shorts от проверенных компаний"
    },
    "activeFilters": "Активные фильтры: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Нет shorts в этом районе",
      "description": "Попробуйте расширить радиус или изменить фильтры",
      "expandRadius": "Расширить радиус",
      "clearFilters": "Сбросить фильтры",
      "browseAll": "Смотреть все"
    },
    "noFollowing": {
      "title": "Вы пока не подписаны ни на одну компанию",
      "description": "Откройте для себя местные компании и начните подписываться",
      "discoverCta": "Открыть компании"
    }
  },
  "loading": {
    "more": "Загрузка...",
    "skeleton": "Загрузка shorts..."
  },
  "card": {
    "views": "{count} просмотров",
    "likes": "{count} лайков",
    "distance": "в {distance}"
  }
}
```

**Ukrainian (uk):**
```json
{
  "sort": {
    "label": "Сортування",
    "algorithmic": "Для вас",
    "newest": "Найновіші",
    "popular": "Популярні",
    "trending": "У тренді",
    "following": "Підписки"
  },
  "filters": {
    "title": "Фільтри",
    "apply": "Застосувати фільтри",
    "clear": "Очистити все",
    "location": {
      "label": "Місцезнаходження",
      "radius": "Радіус",
      "detectLocation": "Визначити місцезнаходження",
      "wholeCountry": "Вся країна",
      "nearMe": "Поруч ({distance})",
      "radiusOptions": {
        "1km": "1 км",
        "5km": "5 км",
        "10km": "10 км",
        "25km": "25 км",
        "50km": "50 км",
        "all": "Вся країна"
      }
    },
    "categories": {
      "label": "Категорії",
      "placeholder": "Виберіть категорії...",
      "maxSelected": "Максимум {max} категорій"
    },
    "tags": {
      "label": "Теги",
      "placeholder": "Пошук тегів..."
    },
    "verifiedOnly": {
      "label": "Тільки перевірені",
      "description": "Показувати тільки shorts від перевірених компаній"
    },
    "activeFilters": "Активні фільтри: {count}"
  },
  "empty": {
    "noShorts": {
      "title": "Немає shorts у цьому районі",
      "description": "Спробуйте розширити радіус або змінити фільтри",
      "expandRadius": "Розширити радіус",
      "clearFilters": "Скинути фільтри",
      "browseAll": "Переглянути все"
    },
    "noFollowing": {
      "title": "Ви ще не підписані на жодну компанію",
      "description": "Відкрийте для себе місцеві компанії та почніть підписуватися",
      "discoverCta": "Відкрити компанії"
    }
  },
  "loading": {
    "more": "Завантаження...",
    "skeleton": "Завантаження shorts..."
  },
  "card": {
    "views": "{count} переглядів",
    "likes": "{count} вподобань",
    "distance": "в {distance}"
  }
}
```

#### search.json

**Polish (pl):**
```json
{
  "bar": {
    "placeholder": "Szukaj shortow, firm, kategorii...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Ostatnie wyszukiwania",
    "popular": "Popularne wyszukiwania",
    "shorts": "Shorty",
    "companies": "Firmy",
    "clearRecent": "Wyczysc historie"
  },
  "tabs": {
    "all": "Wszystko",
    "shorts": "Shorty",
    "companies": "Firmy"
  },
  "results": {
    "title": "Wyniki dla \"{query}\"",
    "count": "{count} wynikow",
    "noResults": {
      "title": "Nie znaleziono wynikow dla \"{query}\"",
      "description": "Sprobuj innych slow kluczowych lub sprawdz pisownie",
      "suggestions": "Moze Cie zainteresowac:"
    }
  },
  "filters": {
    "inCategory": "w kategorii",
    "inLocation": "w lokalizacji"
  }
}
```

**English (en):**
```json
{
  "bar": {
    "placeholder": "Search shorts, companies, categories...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Recent searches",
    "popular": "Popular searches",
    "shorts": "Shorts",
    "companies": "Companies",
    "clearRecent": "Clear history"
  },
  "tabs": {
    "all": "All",
    "shorts": "Shorts",
    "companies": "Companies"
  },
  "results": {
    "title": "Results for \"{query}\"",
    "count": "{count} results",
    "noResults": {
      "title": "No results found for \"{query}\"",
      "description": "Try different keywords or check spelling",
      "suggestions": "You might be interested in:"
    }
  },
  "filters": {
    "inCategory": "in category",
    "inLocation": "in location"
  }
}
```

**German (de):**
```json
{
  "bar": {
    "placeholder": "Shorts, Unternehmen, Kategorien suchen...",
    "shortcut": "Strg+K"
  },
  "suggestions": {
    "recent": "Letzte Suchen",
    "popular": "Beliebte Suchen",
    "shorts": "Shorts",
    "companies": "Unternehmen",
    "clearRecent": "Verlauf loschen"
  },
  "tabs": {
    "all": "Alle",
    "shorts": "Shorts",
    "companies": "Unternehmen"
  },
  "results": {
    "title": "Ergebnisse fur \"{query}\"",
    "count": "{count} Ergebnisse",
    "noResults": {
      "title": "Keine Ergebnisse fur \"{query}\" gefunden",
      "description": "Versuche andere Schlusselworter oder uberprufe die Schreibweise",
      "suggestions": "Das konnte dich interessieren:"
    }
  },
  "filters": {
    "inCategory": "in Kategorie",
    "inLocation": "am Standort"
  }
}
```

**Spanish (es):**
```json
{
  "bar": {
    "placeholder": "Buscar shorts, empresas, categorias...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Busquedas recientes",
    "popular": "Busquedas populares",
    "shorts": "Shorts",
    "companies": "Empresas",
    "clearRecent": "Borrar historial"
  },
  "tabs": {
    "all": "Todo",
    "shorts": "Shorts",
    "companies": "Empresas"
  },
  "results": {
    "title": "Resultados para \"{query}\"",
    "count": "{count} resultados",
    "noResults": {
      "title": "No se encontraron resultados para \"{query}\"",
      "description": "Intenta con otras palabras clave o revisa la ortografia",
      "suggestions": "Te puede interesar:"
    }
  },
  "filters": {
    "inCategory": "en categoria",
    "inLocation": "en ubicacion"
  }
}
```

**Russian (ru):**
```json
{
  "bar": {
    "placeholder": "Поиск shorts, компаний, категорий...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Недавние поиски",
    "popular": "Популярные поиски",
    "shorts": "Shorts",
    "companies": "Компании",
    "clearRecent": "Очистить историю"
  },
  "tabs": {
    "all": "Все",
    "shorts": "Shorts",
    "companies": "Компании"
  },
  "results": {
    "title": "Результаты для \"{query}\"",
    "count": "{count} результатов",
    "noResults": {
      "title": "Ничего не найдено по запросу \"{query}\"",
      "description": "Попробуйте другие ключевые слова или проверьте правописание",
      "suggestions": "Вам может быть интересно:"
    }
  },
  "filters": {
    "inCategory": "в категории",
    "inLocation": "в локации"
  }
}
```

**Ukrainian (uk):**
```json
{
  "bar": {
    "placeholder": "Пошук shorts, компаній, категорій...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Нещодавні пошуки",
    "popular": "Популярні пошуки",
    "shorts": "Shorts",
    "companies": "Компанії",
    "clearRecent": "Очистити історію"
  },
  "tabs": {
    "all": "Все",
    "shorts": "Shorts",
    "companies": "Компанії"
  },
  "results": {
    "title": "Результати для \"{query}\"",
    "count": "{count} результатів",
    "noResults": {
      "title": "Нічого не знайдено за запитом \"{query}\"",
      "description": "Спробуйте інші ключові слова або перевірте правопис",
      "suggestions": "Вам може бути цікаво:"
    }
  },
  "filters": {
    "inCategory": "в категорії",
    "inLocation": "в локації"
  }
}
```

---

### 1.4 User Access Flow

```
                        ┌─────────────────────────────┐
                        │         User Arrives        │
                        │    /[locale] (Home Page)    │
                        └──────────────┬──────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
  │  Browse Feed    │        │   Use Search    │        │  Apply Filters  │
  │  (Scroll Down)  │        │  (Click Bar)    │        │  (Click Icon)   │
  └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
           │                          │                          │
           │                          ▼                          ▼
           │               ┌─────────────────────┐    ┌─────────────────────┐
           │               │ Type Query (2+ ch)  │    │ FilterPanel Opens   │
           │               │ See Autocomplete    │    │ (Sheet on Mobile)   │
           │               └─────────┬───────────┘    │ (Sidebar on Desktop)│
           │                         │                └──────────┬──────────┘
           │                         ▼                           │
           │               ┌─────────────────────┐               │
           │               │  Press Enter or     │               │
           │               │  Click Suggestion   │               │
           │               └─────────┬───────────┘               │
           │                         │                           │
           │                         ▼                           │
           │               ┌─────────────────────┐               │
           │               │ /[locale]/search    │               │
           │               │ ?q={query}          │               │
           │               └─────────┬───────────┘               │
           │                         │                           │
           ▼                         ▼                           ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                        Feed/Results Grid                             │
  │  - Infinite scroll (loads more at 80%)                              │
  │  - Click card → /[locale]/shorts/[id]                               │
  │  - Hover/tap → Video preview (autoplay muted)                       │
  └─────────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                     Short Detail Page                                │
  │  /[locale]/shorts/[id]                                              │
  │  - Full video player                                                 │
  │  - Company info + CTA                                                │
  │  - Related shorts                                                    │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Design

### 2.1 PostgreSQL Extensions

**Enable Extensions (Neon DB supports these):**

```sql
-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Note:** Run via Neon console or migration. Prisma does not manage extensions directly.

### 2.2 Database Indexes (ADDITIVE ONLY)

Create a migration file: `prisma/migrations/[timestamp]_feed_discovery_indexes.sql`

```sql
-- ============================================================
-- Feed Discovery Indexes (Stage 4)
-- ============================================================

-- 1. Published shorts index (partial index for feed queries)
CREATE INDEX IF NOT EXISTS idx_shorts_published
ON "Short"("publishedAt" DESC)
WHERE status = 'PUBLISHED';

-- 2. Category filter on published shorts
CREATE INDEX IF NOT EXISTS idx_shorts_category_published
ON "Short"("categoryId")
WHERE status = 'PUBLISHED';

-- 3. Geospatial index (composite for lat/lng queries)
CREATE INDEX IF NOT EXISTS idx_shorts_location
ON "Short"(latitude, longitude)
WHERE status = 'PUBLISHED' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Full-text search index (Polish dictionary)
CREATE INDEX IF NOT EXISTS idx_shorts_search
ON "Short" USING GIN(
  to_tsvector('polish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- 5. Trigram index for fuzzy title matching
CREATE INDEX IF NOT EXISTS idx_shorts_title_trigram
ON "Short" USING GIST(title gist_trgm_ops);

-- 6. Company name search for autocomplete
CREATE INDEX IF NOT EXISTS idx_company_name_trigram
ON "CompanyProfile" USING GIST("companyName" gist_trgm_ops);

-- 7. Tags search index
CREATE INDEX IF NOT EXISTS idx_tags_search
ON "Tag" USING GIN(to_tsvector('polish', name));

-- 8. ShortStats join optimization
CREATE INDEX IF NOT EXISTS idx_short_stats_shortid
ON "ShortStats"("shortId");

-- 9. Tags by usage (for popular tags)
CREATE INDEX IF NOT EXISTS idx_tags_usage
ON "Tag"("usageCount" DESC);
```

### 2.3 Prisma Schema (No Changes Required)

The existing `Short` model already has:
- `latitude`, `longitude` - Float? fields for geolocation
- `status` - ShortStatus enum
- `publishedAt` - DateTime for sorting
- `categoryId` - Category relation
- `tags` - ShortTag relation
- `stats` - ShortStats relation

**No schema changes needed** - only indexes added via raw SQL migration.

---

## 3. API Layer Design

### 3.1 GET /api/feed

**File:** `src/app/api/feed/route.ts`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max: 50) |
| `sort` | string | 'algorithmic' | algorithmic, newest, popular, trending, following |
| `categoryIds` | string | - | Comma-separated category IDs |
| `tags` | string | - | Comma-separated tag slugs |
| `lat` | float | - | User latitude |
| `lng` | float | - | User longitude |
| `radius` | int | 25 | Radius in km (1, 5, 10, 25, 50, null for all) |
| `verifiedOnly` | boolean | false | Filter verified companies only |

**Response:**

```typescript
interface FeedResponse {
  shorts: FeedShort[]
  nextPage: number | null
  totalCount: number
  hasMore: boolean
}

interface FeedShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: string
  views: number
  likes: number
  ctaClicks: number
  location: string | null
  distance: number | null  // in km, if user location provided
  company: {
    id: string
    name: string
    slug: string
    logo: string | null
    verified: boolean
  }
  category: {
    id: string
    name: string
    slug: string
  }
  ctaLink: string | null
}
```

**Scoring Algorithm (for `sort=algorithmic`):**

```typescript
function calculateScore(short: Short, userLocation?: LatLng): number {
  const now = Date.now()
  const publishedAt = new Date(short.publishedAt).getTime()
  const ageInHours = (now - publishedAt) / (1000 * 60 * 60)

  // Recency score (20% weight) - exponential decay
  const recencyScore = Math.exp(-ageInHours / 168)  // 168h = 7 days half-life

  // Engagement score (50% weight)
  const views = short.stats?.views || 1
  const likes = short.stats?.likes || 0
  const comments = short.stats?.comments || 0
  const ctaClicks = short.stats?.ctaClicks || 0
  const engagementRate = (likes + comments * 2 + ctaClicks * 3) / views
  const engagementScore = Math.min(engagementRate * 10, 1)  // cap at 1

  // Geo boost (10% weight) - if user location available
  let geoScore = 0.5  // neutral
  if (userLocation && short.latitude && short.longitude) {
    const distance = haversineDistance(
      userLocation,
      { lat: short.latitude, lng: short.longitude }
    )
    if (distance < 5) geoScore = 1.0       // < 5km = full boost
    else if (distance < 25) geoScore = 0.7 // < 25km = partial boost
    else geoScore = 0.3                     // > 25km = minimal
  }

  // Personalization placeholder (20% weight) - Stage 5
  const personalizationScore = 0.5  // neutral for now

  return (
    recencyScore * 0.20 +
    engagementScore * 0.50 +
    geoScore * 0.10 +
    personalizationScore * 0.20
  )
}
```

**Diversity Filter:**

```typescript
// Max 2 shorts from same company in top 20
function applyDiversityFilter(shorts: FeedShort[]): FeedShort[] {
  const companyCount = new Map<string, number>()
  const result: FeedShort[] = []
  const deferred: FeedShort[] = []

  for (const short of shorts) {
    const count = companyCount.get(short.company.id) || 0
    if (count < 2 && result.length < 20) {
      result.push(short)
      companyCount.set(short.company.id, count + 1)
    } else {
      deferred.push(short)
    }
  }

  return [...result, ...deferred]
}
```

### 3.2 GET /api/search

**File:** `src/app/api/search/route.ts`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search query (min 2 chars) |
| `type` | string | 'all' | all, shorts, companies |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max: 100) |
| `categoryIds` | string | - | Comma-separated category IDs |
| `lat`, `lng`, `radius` | - | - | Location filter |

**Response:**

```typescript
interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  nextPage: number | null
  query: string
}

type SearchResult =
  | { type: 'short'; data: FeedShort; rank: number }
  | { type: 'company'; data: CompanyResult; rank: number }

interface CompanyResult {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: number
}
```

**Search Implementation (PostgreSQL):**

```sql
-- Full-text search with ranking
SELECT
  s.*,
  ts_rank(
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
    plainto_tsquery('polish', $1)
  ) AS rank
FROM "Short" s
WHERE
  s.status = 'PUBLISHED'
  AND (
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
    @@ plainto_tsquery('polish', $1)
    OR s.title % $1  -- trigram similarity fallback
  )
ORDER BY rank DESC
LIMIT $2 OFFSET $3;
```

### 3.3 GET /api/search/suggestions

**File:** `src/app/api/search/suggestions/route.ts`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Partial query (min 1 char) |

**Response:**

```typescript
interface SuggestionsResponse {
  recent: string[]          // from localStorage (passed from client)
  popular: string[]         // top 5 trending searches
  shorts: ShortSuggestion[] // top 3 matching shorts
  companies: CompanySuggestion[] // top 3 matching companies
}

interface ShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface CompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}
```

---

## 4. Component Architecture

### 4.1 Component Hierarchy

```
src/components/
├── feed/
│   ├── feed-grid.tsx           # Infinite scroll container with useInfiniteQuery
│   ├── feed-card.tsx           # Video card with hover preview (extends VideoCard)
│   ├── feed-skeleton.tsx       # Loading skeleton grid
│   ├── feed-video-preview.tsx  # Autoplay video on hover/tap
│   ├── filter-panel.tsx        # Sheet (mobile) / Sidebar (desktop)
│   ├── sort-dropdown.tsx       # 5 sort options
│   ├── radius-selector.tsx     # Location radius dropdown
│   ├── category-multi-select.tsx # Multi-select with hierarchy
│   ├── tag-filter.tsx          # Tag autocomplete filter
│   ├── verified-toggle.tsx     # Verified only switch
│   ├── active-filters-bar.tsx  # Pills showing active filters
│   ├── empty-state.tsx         # No results / no following variants
│   └── location-picker.tsx     # Leaflet-based location picker
├── search/
│   ├── search-bar.tsx          # Command-based autocomplete
│   ├── search-suggestions.tsx  # Dropdown with categories
│   ├── search-results.tsx      # Results grid with tabs
│   └── search-tabs.tsx         # All / Shorts / Companies tabs
└── shorts/
    └── short-detail-view.tsx   # Public short player page
```

### 4.2 Component Specifications

#### FeedGrid

**File:** `src/components/feed/feed-grid.tsx`

**Props:**
```typescript
interface FeedGridProps {
  initialData: FeedResponse
  filters: FeedFilters
}

interface FeedFilters {
  sort: 'algorithmic' | 'newest' | 'popular' | 'trending' | 'following'
  categoryIds?: string[]
  tags?: string[]
  lat?: number
  lng?: number
  radius?: number
  verifiedOnly?: boolean
}
```

**Implementation Pattern:**
```typescript
"use client"

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'

export function FeedGrid({ initialData, filters }: FeedGridProps) {
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: ({ pageParam = 1 }) => fetchFeed({ ...filters, page: pageParam }),
    initialData: { pages: [initialData], pageParams: [1] },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  // Prefetch at 80% scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allShorts = data?.pages.flatMap(page => page.shorts) ?? []

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {allShorts.map((short) => (
        <FeedCard key={short.id} short={short} />
      ))}

      {/* Load more trigger (invisible) */}
      <div ref={loadMoreRef} className="col-span-full h-1" />

      {isFetchingNextPage && <FeedSkeleton count={4} />}
    </div>
  )
}
```

#### FeedCard

**File:** `src/components/feed/feed-card.tsx`

**Props:**
```typescript
interface FeedCardProps {
  short: FeedShort
}
```

**Features:**
- Extends `VideoCard` styling
- Adds video preview on hover (desktop) / tap (mobile)
- Shows distance badge if location available
- Click → navigate to `/[locale]/shorts/[id]`

```typescript
"use client"

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useState } from 'react'

export function FeedCard({ short }: FeedCardProps) {
  const locale = useLocale()
  const [showPreview, setShowPreview] = useState(false)

  return (
    <Link
      href={`/${locale}/shorts/${short.id}`}
      className="group relative block"
    >
      <div
        className="relative aspect-[9/16] rounded-2xl overflow-hidden"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Thumbnail */}
        <img
          src={short.thumbnailUrl}
          alt={short.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Video Preview (lazy loaded) */}
        {showPreview && short.hlsPlaylistUrl && (
          <FeedVideoPreview
            src={short.hlsPlaylistUrl}
            className="absolute inset-0"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

        {/* Stats badge */}
        <StatsBadge views={short.views} likes={short.likes} />

        {/* Distance badge */}
        {short.distance !== null && (
          <DistanceBadge distance={short.distance} />
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold line-clamp-2">{short.title}</h3>
          <CompanyBadge company={short.company} />
          {short.ctaLink && <CtaButton text="Zobacz wiecej" />}
        </div>
      </div>
    </Link>
  )
}
```

#### SearchBar

**File:** `src/components/search/search-bar.tsx`

**Props:**
```typescript
interface SearchBarProps {
  className?: string
  onSearch?: (query: string) => void
}
```

**Features:**
- Uses Command component for autocomplete
- Debounced search (300ms)
- Keyboard shortcuts (Ctrl+K to focus)
- Categories: Recent, Popular, Shorts, Companies

```typescript
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      fetchSuggestions(debouncedQuery).then(setSuggestions)
    }
  }, [debouncedQuery])

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim().length >= 2) {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`)
      setOpen(false)
    }
  }

  return (
    <Command className={className}>
      <CommandInput
        placeholder={t('search.bar.placeholder')}
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
      />
      <CommandList>
        <CommandEmpty>{t('search.results.noResults.title')}</CommandEmpty>

        {suggestions?.recent.length > 0 && (
          <CommandGroup heading={t('search.suggestions.recent')}>
            {suggestions.recent.map((item) => (
              <CommandItem key={item} onSelect={() => handleSearch(item)}>
                <Clock className="mr-2 h-4 w-4" />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {suggestions?.shorts.length > 0 && (
          <CommandGroup heading={t('search.suggestions.shorts')}>
            {suggestions.shorts.map((short) => (
              <CommandItem
                key={short.id}
                onSelect={() => router.push(`/${locale}/shorts/${short.id}`)}
              >
                <Video className="mr-2 h-4 w-4" />
                {short.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {suggestions?.companies.length > 0 && (
          <CommandGroup heading={t('search.suggestions.companies')}>
            {suggestions.companies.map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => router.push(`/${locale}/firma/${company.slug}`)}
              >
                <Building className="mr-2 h-4 w-4" />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
```

#### FilterPanel

**File:** `src/components/feed/filter-panel.tsx`

**Props:**
```typescript
interface FilterPanelProps {
  filters: FeedFilters
  onFiltersChange: (filters: FeedFilters) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Features:**
- Mobile: Sheet (bottom slide-up)
- Desktop: Popover or sidebar
- Contains: LocationPicker, CategoryMultiSelect, TagFilter, VerifiedToggle
- Apply button (batch updates)

```typescript
"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'

export function FilterPanel({ filters, onFiltersChange, open, onOpenChange }: FilterPanelProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const content = (
    <div className="space-y-6">
      <LocationPicker
        lat={localFilters.lat}
        lng={localFilters.lng}
        radius={localFilters.radius}
        onChange={(lat, lng, radius) =>
          setLocalFilters({ ...localFilters, lat, lng, radius })
        }
      />

      <CategoryMultiSelect
        selected={localFilters.categoryIds ?? []}
        onChange={(ids) => setLocalFilters({ ...localFilters, categoryIds: ids })}
        max={5}
      />

      <TagFilter
        selected={localFilters.tags ?? []}
        onChange={(tags) => setLocalFilters({ ...localFilters, tags })}
        max={5}
      />

      <VerifiedToggle
        checked={localFilters.verifiedOnly ?? false}
        onChange={(checked) => setLocalFilters({ ...localFilters, verifiedOnly: checked })}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setLocalFilters({})}>
          {t('filters.clear')}
        </Button>
        <Button onClick={handleApply}>
          {t('filters.apply')}
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>{t('filters.title')}</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-80">
        {content}
      </PopoverContent>
    </Popover>
  )
}
```

#### LocationPicker

**File:** `src/components/feed/location-picker.tsx`

**Props:**
```typescript
interface LocationPickerProps {
  lat?: number
  lng?: number
  radius?: number
  onChange: (lat: number | undefined, lng: number | undefined, radius: number | undefined) => void
}
```

**Features:**
- Uses Leaflet (existing in codebase, NOT Mapbox)
- Browser geolocation detection
- Radius selector dropdown
- Manual location override via Nominatim geocoding

```typescript
"use client"

import dynamic from 'next/dynamic'
import { useGeolocation } from '@/hooks/use-geolocation'

const LocationMap = dynamic(
  () => import('@/components/companies/location-map').then(mod => mod.LocationMap),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
)

const RADIUS_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: undefined, label: t('filters.location.wholeCountry') },
]

export function LocationPicker({ lat, lng, radius, onChange }: LocationPickerProps) {
  const { location, loading, error, detect } = useGeolocation()
  const [showMap, setShowMap] = useState(false)

  const handleDetect = async () => {
    const result = await detect()
    if (result) {
      onChange(result.lat, result.lng, radius ?? 25)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDetect}
          disabled={loading}
        >
          <Navigation className="h-4 w-4 mr-2" />
          {loading ? t('filters.location.detecting') : t('filters.location.detectLocation')}
        </Button>

        <Select
          value={radius?.toString() ?? 'all'}
          onValueChange={(v) => onChange(lat, lng, v === 'all' ? undefined : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('filters.location.radius')} />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value ?? 'all'} value={opt.value?.toString() ?? 'all'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lat && lng && (
        <div className="text-sm text-muted-foreground">
          {t('filters.location.nearMe', { distance: `${radius ?? 25} km` })}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowMap(!showMap)}>
        <MapPin className="h-4 w-4 mr-2" />
        {showMap ? t('profile.fields.hideMap') : t('profile.fields.showOnMap')}
      </Button>

      {showMap && (
        <LocationMap
          latitude={lat ?? 52.0}
          longitude={lng ?? 19.0}
          onPositionChange={(newLat, newLng) => onChange(newLat, newLng, radius)}
        />
      )}
    </div>
  )
}
```

#### EmptyState

**File:** `src/components/feed/empty-state.tsx`

**Props:**
```typescript
interface EmptyStateProps {
  variant: 'no-shorts' | 'no-following' | 'no-search-results'
  query?: string
  onExpandRadius?: () => void
  onClearFilters?: () => void
}
```

```typescript
export function EmptyState({ variant, query, onExpandRadius, onClearFilters }: EmptyStateProps) {
  const t = useTranslations('feed')

  const configs = {
    'no-shorts': {
      icon: Video,
      title: t('empty.noShorts.title'),
      description: t('empty.noShorts.description'),
      actions: [
        { label: t('empty.noShorts.expandRadius'), onClick: onExpandRadius },
        { label: t('empty.noShorts.clearFilters'), onClick: onClearFilters },
      ]
    },
    'no-following': {
      icon: Users,
      title: t('empty.noFollowing.title'),
      description: t('empty.noFollowing.description'),
      actions: [
        { label: t('empty.noFollowing.discoverCta'), href: `/${locale}` }
      ]
    },
    'no-search-results': {
      icon: SearchX,
      title: t('search.results.noResults.title', { query }),
      description: t('search.results.noResults.description'),
      actions: []
    }
  }

  const config = configs[variant]

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <config.icon className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{config.description}</p>
      <div className="flex gap-3">
        {config.actions.map((action, i) => (
          action.href ? (
            <Button key={i} asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button key={i} variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Hooks Design

### 5.1 useInfiniteScroll (P0)

**File:** `src/hooks/use-infinite-scroll.ts`

```typescript
import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number  // 0-1, default 0.8
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.8
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore || isLoading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, isLoading, onLoadMore, threshold])

  return { sentinelRef }
}
```

### 5.2 useGeolocation (P1)

**File:** `src/hooks/use-geolocation.ts`

```typescript
import { useState, useCallback } from 'react'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
  })

  const detect = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation not supported' }))
      return null
    }

    setState(s => ({ ...s, loading: true, error: null }))

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setState({ location, loading: false, error: null })
          resolve(location)
        },
        (error) => {
          setState(s => ({ ...s, loading: false, error: error.message }))
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }, [])

  return { ...state, detect }
}
```

### 5.3 useDebounce (P1)

**File:** `src/hooks/use-debounce.ts`

```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

### 5.4 useFeedFilters (P2)

**File:** `src/hooks/use-feed-filters.ts`

```typescript
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export function useFeedFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo<FeedFilters>(() => ({
    sort: (searchParams.get('sort') as FeedFilters['sort']) ?? 'algorithmic',
    categoryIds: searchParams.get('categoryIds')?.split(',').filter(Boolean),
    tags: searchParams.get('tags')?.split(',').filter(Boolean),
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
  }), [searchParams])

  const setFilters = useCallback((newFilters: Partial<FeedFilters>) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, String(value))
      }
    })

    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  return { filters, setFilters }
}
```

---

## 6. File Structure Summary

### 6.1 New Files to Create

```
src/
├── app/
│   ├── (main)/
│   │   └── [locale]/
│   │       ├── search/
│   │       │   └── page.tsx                    # Search results page
│   │       └── shorts/
│   │           └── [id]/
│   │               └── page.tsx                # Public short detail
│   └── api/
│       ├── feed/
│       │   └── route.ts                        # GET /api/feed
│       └── search/
│           ├── route.ts                        # GET /api/search
│           └── suggestions/
│               └── route.ts                    # GET /api/search/suggestions
├── components/
│   ├── feed/
│   │   ├── feed-grid.tsx
│   │   ├── feed-card.tsx
│   │   ├── feed-skeleton.tsx
│   │   ├── feed-video-preview.tsx
│   │   ├── filter-panel.tsx
│   │   ├── sort-dropdown.tsx
│   │   ├── radius-selector.tsx
│   │   ├── category-multi-select.tsx
│   │   ├── tag-filter.tsx
│   │   ├── verified-toggle.tsx
│   │   ├── active-filters-bar.tsx
│   │   ├── empty-state.tsx
│   │   └── location-picker.tsx
│   ├── search/
│   │   ├── search-bar.tsx
│   │   ├── search-suggestions.tsx
│   │   ├── search-results.tsx
│   │   └── search-tabs.tsx
│   └── shorts/
│       └── short-detail-view.tsx
├── hooks/
│   ├── use-infinite-scroll.ts
│   ├── use-geolocation.ts
│   ├── use-debounce.ts
│   └── use-feed-filters.ts
└── lib/
    ├── locales/
    │   ├── pl/
    │   │   ├── feed.json
    │   │   └── search.json
    │   ├── en/
    │   │   ├── feed.json
    │   │   └── search.json
    │   ├── de/
    │   │   ├── feed.json
    │   │   └── search.json
    │   ├── es/
    │   │   ├── feed.json
    │   │   └── search.json
    │   ├── ru/
    │   │   ├── feed.json
    │   │   └── search.json
    │   └── uk/
    │       ├── feed.json
    │       └── search.json
    └── utils/
        ├── haversine.ts                        # Distance calculation
        └── feed-scoring.ts                     # Algorithmic scoring
```

### 6.2 Files to Modify

| File | Changes |
|------|---------|
| `src/app/(main)/[locale]/page.tsx` | Convert from static to dynamic feed |
| `src/components/layout/header.tsx` | Add SearchBar, SortDropdown, FilterButton |
| `src/components/home/video-card.tsx` | Add video preview on hover |
| `i18n.ts` | Add feed.json and search.json imports |
| `prisma/migrations/` | Add indexes migration |

---

## 7. Implementation Phases

### Phase 1: Database Setup (Day 1)

**Tasks:**
1. Enable PostGIS and pg_trgm extensions in Neon DB
2. Create migration with all required indexes
3. Test index creation in development

**Deliverables:**
- `prisma/migrations/[timestamp]_feed_discovery_indexes.sql`
- Verified extensions enabled

### Phase 2: API Layer (Days 2-3)

**Tasks:**
1. Implement GET /api/feed with all query params
2. Implement scoring algorithm
3. Implement diversity filter
4. Implement GET /api/search with full-text search
5. Implement GET /api/search/suggestions

**Deliverables:**
- `src/app/api/feed/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/search/suggestions/route.ts`
- `src/lib/utils/feed-scoring.ts`
- `src/lib/utils/haversine.ts`

### Phase 3: Core Components (Days 4-5)

**Tasks:**
1. Create FeedGrid with useInfiniteQuery
2. Create FeedCard with hover preview
3. Create FeedSkeleton
4. Create EmptyState variants
5. Modify home page to use dynamic feed

**Deliverables:**
- `src/components/feed/feed-grid.tsx`
- `src/components/feed/feed-card.tsx`
- `src/components/feed/feed-skeleton.tsx`
- `src/components/feed/empty-state.tsx`
- Modified `src/app/(main)/[locale]/page.tsx`

### Phase 4: Filters (Days 6-7)

**Tasks:**
1. Create FilterPanel (Sheet + Popover)
2. Create LocationPicker with Leaflet
3. Create CategoryMultiSelect
4. Create TagFilter
5. Create SortDropdown
6. Create VerifiedToggle
7. Create ActiveFiltersBar

**Deliverables:**
- `src/components/feed/filter-panel.tsx`
- `src/components/feed/location-picker.tsx`
- `src/components/feed/category-multi-select.tsx`
- `src/components/feed/tag-filter.tsx`
- `src/components/feed/sort-dropdown.tsx`
- `src/components/feed/verified-toggle.tsx`
- `src/components/feed/active-filters-bar.tsx`

### Phase 5: Search (Days 8-9)

**Tasks:**
1. Create SearchBar with Command component
2. Create SearchSuggestions dropdown
3. Create search page
4. Create SearchResults grid
5. Create SearchTabs

**Deliverables:**
- `src/components/search/search-bar.tsx`
- `src/components/search/search-suggestions.tsx`
- `src/app/(main)/[locale]/search/page.tsx`
- `src/components/search/search-results.tsx`
- `src/components/search/search-tabs.tsx`

### Phase 6: Translations & Polish (Day 10)

**Tasks:**
1. Create all 12 translation files (6 languages x 2 namespaces)
2. Update i18n.ts configuration
3. Create public short detail page
4. Header integration (SearchBar, FilterButton)
5. Performance testing

**Deliverables:**
- All translation files in `src/lib/locales/`
- `src/app/(main)/[locale]/shorts/[id]/page.tsx`
- Modified `src/components/layout/header.tsx`
- Updated `i18n.ts`

---

## 8. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Maps Library | Leaflet | Already in codebase, free, no API key |
| Infinite Scroll | TanStack Query useInfiniteQuery | Already in stack, caching, prefetch |
| Search | PostgreSQL tsvector + pg_trgm | Native, no external service, Polish support |
| Following Feed | Show empty state with CTA | Defer Follow model to Stage 5 |
| Video Preview | Native HTML5 video | Lightweight, no library needed |
| Geolocation | Browser Geolocation API | Standard, no external service |
| Filter Panel | Sheet (mobile) / Popover (desktop) | Existing UI patterns |

---

## 9. Dependencies

### New NPM Packages

None required - all functionality uses existing packages:
- `@tanstack/react-query` - already installed
- `react-leaflet` - already installed
- `cmdk` - already installed (Command component)

### PostgreSQL Extensions

- `postgis` - Must be enabled in Neon DB console
- `pg_trgm` - Must be enabled in Neon DB console

---

## 10. Performance Considerations

### Database

- Partial indexes for published shorts only
- Composite indexes for location queries
- Full-text search with GIN index
- Stats table separate from shorts (avoid N+1)

### Frontend

- Skeleton loading for perceived performance
- Prefetch next page at 80% scroll
- Lazy load video previews (only on hover)
- Image optimization with Next.js Image
- Debounced search input (300ms)

### Caching

- TanStack Query caching (5 min stale time)
- ISR on home page (60 second revalidation)
- Search suggestions cached (5 min)

---

**Architecture Status:** COMPLETE
**Ready for:** Critic Review
**Next Step:** Iterate based on critic feedback or proceed to task planning
