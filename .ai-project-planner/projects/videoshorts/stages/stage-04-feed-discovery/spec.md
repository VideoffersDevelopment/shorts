# Etap 4: Feed + Discovery

**Projekt:** VideoShorts
**Priorytet:** P0 (Critical - MVP Core)
**Zależności:** Etap 3 (Shorts + Payments)
**Szacowany czas:** 2-3 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

Stworzenie głównego interfejsu platformy: feed z infinite scroll, system filtrowania (lokalizacja, kategorie), sortowanie (najnowsze, popularne, trending), oraz wyszukiwarka. To etap który scala całą platformę - użytkownicy mogą przeglądać i odkrywać shorty firm.

### Kluczowe Wartości:
- Mobile-first infinite scroll (TikTok-like experience)
- Geolocation filtering (Mapbox radius search)
- Smart sortowanie (algorytmiczne ranking)
- Fast full-text search (PostgreSQL tsvector)

---

## 2. Funkcjonalności

### 2.1 Główny Feed

**Layout:**
- Mobile: vertical scroll, full-width video cards
- Desktop: grid 2-3 kolumny z video cards
- Sticky header z search bar i filtry button
- Infinite scroll (20 shortsów per page)

**Video Card:**
- Thumbnail jako tło
- Play icon overlay
- Hover/tap: video preview (autoplay muted)
- Metadata: title, company logo, location badge, stats (views, likes)
- CTA badge jeśli set
- Click card → redirect do `/shorts/[id]`

**Performance:**
- Prefetch następnej strony (background)
- Lazy load images (Intersection Observer)
- Virtual scrolling (opcjonalne, jeśli performance issue)

### 2.2 Filtry

**Lokalizacja (Geolocation):**
- User location detection (browser geolocation API)
- Radius selector: 1km, 5km, 10km, 25km, 50km, Cały kraj
- Mapbox autocomplete dla manual location override
- PostGIS query: `ST_DWithin(point1, point2, radius)`
- Default: 25km jeśli user location available, "Cały kraj" jeśli brak

**Kategorie:**
- Multi-select dropdown (shadcn/ui Combobox)
- Hierarchical: kategoria + podkategorie
- Max 5 selected categories (prevent over-filtering)
- Pill badges pokazują active filters
- Clear all button

**Tagi:**
- Autocomplete input (search tags z DB)
- Multi-select (max 5)
- Popular tags suggestions (top 10 by usageCount)

**Tylko zweryfikowane firmy:**
- Toggle switch "Verified only"
- Default: OFF (show all)

**Filters UI:**
- Mobile: bottom sheet (slide up)
- Desktop: sidebar lub dropdown
- Active filters summary w header
- Apply button (batched query, nie real-time na każdy change)

### 2.3 Sortowanie

**Opcje:**
1. **Algorytmiczne (Default):**
   - Scoring: recency (20%) + engagement (50%) + personalization (30%)
   - Engagement: (likes + comments * 2 + ctaClicks * 3) / views
   - Personalization: boost jeśli kategoria w user preferences
   - Geo-boost: wyżej shorty z bliższej lokalizacji (+10% za < 5km)
   - Diversity: max 2 shorty z tej samej firmy w top 20

2. **Najnowsze:**
   - ORDER BY publishedAt DESC
   - Simple, predictable

3. **Popularne:**
   - Ostatnie 7 dni: ORDER BY (views + likes * 2) DESC
   - Rolling window (update co 1h)

4. **Trending:**
   - Ostatnie 24h: wysoki engagement rate
   - Formula: engagement_rate * recency_boost
   - Recency boost: linear decay (published 1h ago = 1.0, 24h ago = 0.1)

5. **Obserwowane (requires login):**
   - Tylko shorty z followed companies
   - ORDER BY publishedAt DESC
   - Empty state jeśli brak follows

**UI:**
- Dropdown w header (Desktop)
- Bottom tabs (Mobile)
- Icon indicators (🔥 trending, ⭐ popular)

### 2.4 Wyszukiwanie

**Full-text search:**
- PostgreSQL `tsvector` + `ts_rank`
- Searchable fields: title, description, tags, company name
- Trigram similarity (`pg_trgm`) dla fuzzy match
- Auto-suggestions (debounced, 300ms)
- Search history (per user, max 10, stored in localStorage)

**Search bar:**
- Sticky w header (desktop i mobile)
- Icon: magnifying glass
- Placeholder: "Szukaj shortsów, firm, kategorii..."
- Autocomplete dropdown z suggestions:
  - Recent searches (ikona clock)
  - Popular searches (ikona trending)
  - Shorts matches (ikona video)
  - Company matches (ikona building)

**Search results page:**
- URL: `/search?q=kawiarnia&location=warszawa`
- Tabs: All, Shorts, Companies
- Filters applicable (kategorie, lokalizacja)
- Sortowanie applicable
- Empty state jeśli brak results: "Nie znaleziono, spróbuj inne słowa"

**Performance:**
- Index: `CREATE INDEX idx_shorts_search ON shorts USING GIN (to_tsvector('polish', title || ' ' || description))`
- Trigram index: `CREATE INDEX idx_shorts_trigram ON shorts USING GIST (title gist_trgm_ops)`
- Query timeout: 2s (fallback do simple LIKE search)

### 2.5 Personalizacja (MVP - Podstawowa)

**Learning z interakcji:**
- Track: viewed shorts, liked shorts, watch time, skips
- Store w UserProfile.preferences (JSON)
- Update co 24h (background job)

**Boost rules:**
- Preferowane kategorie: +20% scoring
- Followed companies: +30% scoring
- Similar tags: +10% scoring

**Privacy:**
- User może disable personalization (settings)
- Default: ON (opt-out model)
- Clear history button

### 2.6 Empty States

**No shorts found:**
- Friendly message: "Brak shortsów w tym obszarze"
- Suggestions:
  - Expand radius
  - Remove filters
  - Browse all categories

**No results for search:**
- "Nie znaleziono wyników dla '[query]'"
- Suggestions:
  - Check spelling
  - Try different keywords
  - Browse categories

**Following feed empty:**
- "Nie obserwujesz jeszcze żadnych firm"
- CTA: "Odkryj firmy w Twojej okolicy"

---

## 3. User Stories

### US-04-01: Browse Feed (Default)
**Jako** użytkownik
**Chcę** przeglądać feed shortsów
**Aby** odkryć lokalne firmy i oferty

**Kryteria akceptacji:**
- [ ] Strona główna `/` pokazuje feed
- [ ] Default: algorytmiczne sortowanie, location auto-detected (25km radius)
- [ ] 20 shortsów per page, infinite scroll
- [ ] Video card: thumbnail, title, company, location, stats
- [ ] Hover/tap: autoplay preview (muted)
- [ ] Click card → `/shorts/[id]`
- [ ] Prefetch next page w background
- [ ] Loading states: skeleton cards
- [ ] LCP < 2s

### US-04-02: Filter by Location
**Jako** użytkownik
**Chcę** filtrować shorty po lokalizacji
**Aby** zobaczyć firmy w mojej okolicy

**Kryteria akceptacji:**
- [ ] Location filter w header lub filters panel
- [ ] Auto-detect user location (geolocation API, consent required)
- [ ] Radius selector: 1km, 5km, 10km, 25km, 50km, Cały kraj
- [ ] Mapbox autocomplete dla manual location input
- [ ] Apply filter → query: PostGIS `ST_DWithin`
- [ ] Badge w header: "W promieniu 10km od [Location]"
- [ ] Clear filter button

### US-04-03: Filter by Category
**Jako** użytkownik
**Chcę** filtrować shorty po kategorii
**Aby** zobaczyć tylko to co mnie interesuje

**Kryteria akceptacji:**
- [ ] Category filter (multi-select dropdown)
- [ ] Hierarchical structure: kategoria → podkategorie
- [ ] Max 5 selected
- [ ] Active filters pokazane jako pill badges
- [ ] Apply → query: WHERE categoryId IN (...)
- [ ] Clear all button

### US-04-04: Search Shorts
**Jako** użytkownik
**Chcę** wyszukać shorty po słowie kluczowym
**Aby** szybko znaleźć to czego szukam

**Kryteria akceptacji:**
- [ ] Search bar w header (sticky)
- [ ] Autocomplete (debounced 300ms)
- [ ] Suggestions: recent searches, popular searches, shorts, companies
- [ ] Enter → redirect `/search?q=[query]`
- [ ] Full-text search (tsvector + trigram similarity)
- [ ] Results page: tabs (All, Shorts, Companies), filters applicable
- [ ] Highlight matched keywords w results
- [ ] Search time < 500ms (p95)

### US-04-05: Sort Feed
**Jako** użytkownik
**Chcę** sortować feed
**Aby** widzieć shorty w preferowanej kolejności

**Kryteria akceptacji:**
- [ ] Sort dropdown w header
- [ ] Opcje: Algorytmiczne, Najnowsze, Popularne, Trending, Obserwowane
- [ ] Default: Algorytmiczne
- [ ] Change sort → re-query feed
- [ ] URL query param: `?sort=trending`
- [ ] Persist user preference (localStorage)

### US-04-06: View Following Feed
**Jako** zalogowany użytkownik
**Chcę** zobaczyć shorty tylko z obserwowanych firm
**Aby** śledzić ich nowości

**Kryteria akceptacji:**
- [ ] Sort option: "Obserwowane" (requires login)
- [ ] Query: WHERE companyId IN (user follows)
- [ ] ORDER BY publishedAt DESC
- [ ] Empty state jeśli brak follows: CTA "Discover companies"
- [ ] Badge: "X followed companies"

---

## 4. Wymagania Biznesowe

### 4.1 Feed Content
- Tylko PUBLISHED shorty widoczne
- Exclude ARCHIVED, DELETED, DRAFT
- Respect user privacy: nie pokazuj deleted user shortsów
- Diversity: max 2 shorty z tej samej firmy w top 20

### 4.2 Geolocation
- Default radius: 25km (jeśli location detected)
- Fallback: "Cały kraj" (jeśli location not detected lub denied)
- Location detection opt-in (browser prompt)
- Manual location override zawsze dozwolone

### 4.3 Search
- Full-text search w Polish (tsvector polish dictionary)
- Minimum query length: 2 characters
- Max results: 100 per page
- Search timeout: 2s (fallback do simple LIKE)

### 4.4 Performance
- Feed load time: < 2s LCP
- Scroll smoothness: 60 FPS
- Prefetch: background fetch next page gdy user at 80% scroll
- Image optimization: WebP, lazy load

---

## 5. Wymagania Techniczne

### 5.1 Database Queries

**Feed query (algorytmiczne):**
```sql
-- Simplified version
SELECT s.*,
  COALESCE(ss.views, 0) as views,
  COALESCE(ss.likes, 0) as likes,
  -- Scoring formula
  (
    0.2 * (EXTRACT(EPOCH FROM NOW() - s.publishedAt) / 86400) + -- Recency
    0.5 * ((ss.likes + ss.comments * 2 + ss.ctaClicks * 3) / NULLIF(ss.views, 0)) + -- Engagement
    0.3 * CASE WHEN s.categoryId IN (user_preferences) THEN 1 ELSE 0 END -- Personalization
  ) as score
FROM shorts s
LEFT JOIN short_stats ss ON s.id = ss.shortId
WHERE s.status = 'PUBLISHED'
  AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326), :radius)
  AND s.categoryId IN (:categories) -- Optional filter
ORDER BY score DESC
LIMIT 20 OFFSET :offset;
```

**Search query:**
```sql
SELECT s.*,
  ts_rank(
    to_tsvector('polish', s.title || ' ' || COALESCE(s.description, '')),
    plainto_tsquery('polish', :query)
  ) +
  similarity(s.title, :query) as rank
FROM shorts s
WHERE s.status = 'PUBLISHED'
  AND (
    to_tsvector('polish', s.title || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('polish', :query)
    OR s.title % :query -- Trigram similarity
  )
ORDER BY rank DESC
LIMIT 100;
```

### 5.2 API Endpoints

```
GET    /api/feed
  Query params:
    - page (int, default: 1)
    - limit (int, default: 20, max: 50)
    - sort (algorithmic | newest | popular | trending | following)
    - categoryIds (comma-separated UUIDs)
    - tags (comma-separated slugs)
    - lat, lng, radius (geolocation filter)
    - verifiedOnly (boolean)
  Returns: {shorts: Short[], nextPage: number?, totalCount: number}

GET    /api/search
  Query params:
    - q (string, min 2 chars)
    - type (all | shorts | companies)
    - page, limit, filters (same as feed)
  Returns: {results: (Short | Company)[], suggestions: string[]}

GET    /api/search/suggestions
  Query: ?q=kaw
  Returns: {recent: string[], popular: string[], matches: {shorts, companies}}
```

### 5.3 Database Indexes

```sql
-- Feed performance
CREATE INDEX idx_shorts_published ON shorts(publishedAt DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_location ON shorts USING GIST(location) WHERE status = 'PUBLISHED';
CREATE INDEX idx_shorts_category ON shorts(categoryId) WHERE status = 'PUBLISHED';

-- Search performance
CREATE INDEX idx_shorts_search ON shorts USING GIN(to_tsvector('polish', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_shorts_trigram ON shorts USING GIST(title gist_trgm_ops);
CREATE INDEX idx_tags_search ON tags USING GIN(to_tsvector('polish', name));

-- Stats join optimization
CREATE INDEX idx_short_stats_shortid ON short_stats(shortId);
```

### 5.4 UI Components

**Feed components:**
- FeedGrid (infinite scroll container)
- ShortCard (video card z thumbnail, metadata)
- VideoPreview (autoplay na hover)
- FilterPanel (sidebar/bottom sheet)
- SortDropdown
- LocationPicker (Mapbox autocomplete)
- CategoryPicker (hierarchical multi-select)
- EmptyState (various messages)

**Search components:**
- SearchBar (autocomplete)
- SearchSuggestions (dropdown)
- SearchResults (paginated list)
- SearchFilters (reuse FilterPanel)

### 5.5 Performance Optimization

**Client-side:**
- React Query dla feed data (caching, prefetch)
- Intersection Observer dla lazy load images
- Virtual scrolling (react-window) jeśli > 100 items w DOM
- Debounced search input (300ms)
- Optimistic UI dla filters (instant visual feedback)

**Server-side:**
- Redis cache dla popular queries (post-MVP)
- Query result caching (5 min TTL)
- Database connection pooling (PgBouncer)
- CDN caching dla static assets (Vercel Edge)

---

## 6. Kryteria Akceptacji (Etap jako całość)

### Funkcjonalne:
- [ ] Feed pokazuje published shorty (20 per page, infinite scroll)
- [ ] Location filter działa (radius search, PostGIS)
- [ ] Category filter działa (multi-select, hierarchical)
- [ ] Tag filter działa (multi-select, autocomplete)
- [ ] "Verified only" toggle działa
- [ ] Sortowanie działa (5 opcji: algorithmic, newest, popular, trending, following)
- [ ] Search bar działa (autocomplete, full-text search)
- [ ] Search results page działa (tabs, filters)
- [ ] Video card preview na hover/tap (autoplay muted)
- [ ] Click card → redirect do `/shorts/[id]`
- [ ] Empty states dla no results, no filters match

### Niefunkcjonalne:
- [ ] Feed load time < 2s (LCP)
- [ ] Search results < 500ms (p95)
- [ ] Infinite scroll smooth (60 FPS)
- [ ] Mobile responsive (touch-friendly)
- [ ] Images lazy loaded (Intersection Observer)
- [ ] Prefetch next page (background, 80% scroll)

### Algorytmy:
- [ ] Algorithmic sort: recency + engagement + personalization
- [ ] Trending: high engagement rate last 24h
- [ ] Geo-boost: closer shorty higher score
- [ ] Diversity: max 2 shorty per company w top 20

---

## 7. Out of Scope (Nie w tym etapie)

- ❌ Likes, comments (Etap 5)
- ❌ Follow companies (Etap 5)
- ❌ Share functionality (Post-MVP)
- ❌ Advanced personalization (ML-based, Post-MVP)
- ❌ Real-time updates (SSE/WebSocket, Post-MVP)
- ❌ Saved shorty (Post-MVP)

---

## 8. Zależności

### External Services:
- **Mapbox:** Geolocation autocomplete, radius search
- **PostGIS:** Spatial queries (Neon DB extension enabled)
- **Vercel Edge:** CDN dla images

### Prerequisites:
- Etap 3 ukończony (shorty published, database populated)
- PostGIS extension enabled w Neon DB
- Database indexes created
- Mapbox token configured

---

## 9. Ryzyka i Mitygacje

### Ryzyko 1: Slow Queries (Feed Load Time > 2s)
**Prawdopodobieństwo:** Średnie
**Wpływ:** Wysoki
**Mitygacja:**
- Proper indexes (listed above)
- Query optimization (EXPLAIN ANALYZE)
- Caching layer (Redis, post-MVP)
- Pagination (limit 20)
- Monitor slow queries (Neon dashboard)

### Ryzyko 2: Geolocation Permission Denied
**Prawdopodobieństwo:** Wysokie (50%+ users deny)
**Wpływ:** Średni
**Mitygacja:**
- Fallback: "Cały kraj" (default filter)
- Manual location input (Mapbox autocomplete)
- Clear messaging: "Enable location for local shorts"
- Non-blocking (app działa bez location)

### Ryzyko 3: Empty Feed (No Shorts in User Area)
**Prawdopodobieństwo:** Średnie (niche locations)
**Wpływ:** Średni
**Mitygacja:**
- Suggest expanding radius
- Show "Nearby" shorty (50km, 100km)
- Fallback: trending shorty nationwide
- Empty state CTA: "Be first to publish in your area"

---

## 10. Metryki Sukcesu (Ten Etap)

### Technical Metrics:
- Feed load time < 2s (p95)
- Search response time < 500ms (p95)
- Infinite scroll FPS > 55
- Image lazy load hit rate > 90%

### User Metrics (Post-Launch):
- Average session time > 3 min
- Shorty viewed per session > 5
- Search usage > 20% (z sesji)
- Filter usage > 40% (z sesji)
- Bounce rate < 40%

---

## 11. Harmonogram (Przykładowy)

### Tydzień 1: Feed + Filters
- **Dni 1-2:** Feed query, infinite scroll, video cards
- **Dni 3-4:** Filters (location, categories, tags)
- **Dzień 5:** Sortowanie (5 opcji), algorithmic ranking

### Tydzień 2: Search + Performance
- **Dni 1-2:** Search bar, autocomplete, full-text search
- **Dni 3-4:** Search results page, highlighting
- **Dzień 5:** Performance optimization (indexes, caching, lazy load)

### Tydzień 3: Polish + Testing (opcjonalny)
- **Dni 1-2:** Empty states, error handling, edge cases
- **Dni 3-4:** Mobile responsive testing, UX polish
- **Dzień 5:** Load testing, documentation

---

## 12. Historia Zmian

| Data | Wersja | Autor | Zmiany |
|------|--------|-------|--------|
| 2025-11-28 | 1.0 | AI Stage Planner | Initial specification |

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
**Status:** ✅ Ready for Export to AI Spec Flow
