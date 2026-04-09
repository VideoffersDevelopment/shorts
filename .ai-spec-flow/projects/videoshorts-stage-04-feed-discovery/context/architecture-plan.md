# VideoShorts - Plan Architektury (Reference)

> **ŹRÓDŁO:** `.ai-project-planner/projects/videoshorts/architecture-plan.md`
> **Import:** 2026-01-01
> **Typ:** Context Reference

---

<!--
  Ten plik jest referencją do planu architektury projektu VideoShorts.
  Zawiera informacje o stacku technologicznym, strukturze i przepływach danych.

  Dla pełnej architektury zobacz źródło powyżej.
-->

## Stack Technologiczny

### Frontend
| Technologia | Purpose |
|-------------|---------|
| Next.js 14+ | Framework (App Router, RSC, SSR) |
| React 19+ | UI library |
| TypeScript 5.3+ | Type safety |
| Tailwind CSS 3.4+ | Styling framework |
| shadcn/ui | Component library |
| @tanstack/react-query | Data fetching, caching |
| @vidstack/react | HLS video player |
| mapbox-gl | Interactive maps |

### Backend
| Technologia | Purpose |
|-------------|---------|
| Next.js API Routes | REST API endpoints |
| Server Actions | Type-safe mutations |
| Prisma 5.8+ | ORM + migrations |
| Neon DB (PostgreSQL 15+) | Serverless Postgres |
| PostGIS 3.4+ | Geospatial queries |
| Inngest | Background jobs |

### External Services
| Service | Purpose |
|---------|---------|
| Cloudflare R2 | Storage + CDN |
| Qencode | Video transcoding |
| Mapbox | Geolocation |
| Przelewy24/Tpay | Payments |

## Struktura Projektu (Relevantne dla Etapu 4)

```
src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx           # Feed (home page)
│   │   ├── search/
│   │   │   └── page.tsx       # Search results
│   │   └── shorts/
│   │       └── [id]/
│   │           └── page.tsx   # Short detail
│   └── api/
│       ├── feed/
│       │   └── route.ts       # Feed API
│       └── search/
│           └── route.ts       # Search API
├── components/
│   ├── shorts/
│   │   ├── ShortCard.tsx
│   │   ├── ShortFeed.tsx
│   │   └── VideoPreview.tsx
│   └── shared/
│       ├── InfiniteScroll.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useInfiniteScroll.ts
│   └── useGeolocation.ts
└── lib/
    └── mapbox.ts
```

## Database Indexes (Etap 4)

```sql
-- Feed performance
CREATE INDEX idx_shorts_published ON shorts(publishedAt DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_location ON shorts USING GIST(location) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_category ON shorts(categoryId) WHERE status = 'PUBLISHED';

-- Search performance
CREATE INDEX idx_shorts_search ON shorts USING GIN(to_tsvector('polish', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_shorts_trigram ON shorts USING GIST(title gist_trgm_ops);
```

## API Endpoints (Etap 4)

```
GET /api/feed
  - page, limit, sort, categoryIds, tags, lat, lng, radius, verifiedOnly

GET /api/search
  - q, type, page, limit, filters

GET /api/search/suggestions
  - q
```

---

**Pełna architektura:** `.ai-project-planner/projects/videoshorts/architecture-plan.md`
