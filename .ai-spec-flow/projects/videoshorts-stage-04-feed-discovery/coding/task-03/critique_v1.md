# Code Review: Task 03 - Iteration 1/3

**Commit:** 3d491ee5cda842184904ab0e93d5de86fb59e125
**Verdict:** CHANGES REQUIRED

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | FeedGrid displays shorts from API | PASS | `src/components/feed/feed-grid.tsx` fetches from `/api/feed` |
| 2 | Infinite scroll loads more at bottom | PASS | `useInfiniteScroll` hook with sentinel ref |
| 3 | FeedCard shows thumbnail, title, company, stats | PASS | All elements present in `feed-card.tsx` |
| 4 | FeedCard hover shows video preview | PASS | `FeedVideoPreview` renders on hover |
| 5 | FeedCard click navigates to short detail | PASS | Link to `/${locale}/shorts/${short.id}` |
| 6 | FeedSkeleton shows during initial load | PASS | `FeedSkeleton` component with proper structure |
| 7 | EmptyState shows when no shorts | PASS | `EmptyState` with variants |
| 8 | EmptyState "no-following" variant works | PASS | Variant implemented in `empty-state.tsx` |
| 9 | Distance badge shows when lat/lng provided | PASS | Conditional rendering with distance formatting |
| 10 | Home page loads with dynamic feed | PASS | `HomeFeedWrapper` replaces static content |
| 11 | No TypeScript `any` types | PASS | No `any` types found |
| 12 | All hook dependencies included | PASS | All deps in useEffect/useCallback arrays |
| 13 | npm run build passes | PASS | Build successful |

**Acceptance Criteria Result:** PASS (13/13 criteria met)

---

## Code Quality Issues

### 1. BLOCKER: i18n Configuration Missing (FIX-01 Violation)

**File:** `i18n.ts` (root)
**Problem:** New `feed.json` and `search.json` translation files were created for all 6 locales, but the namespaces are NOT registered in the main `i18n.ts` configuration file. This means translations will NOT be loaded and users will see translation keys like `feed.loading.more` instead of actual text.

**Evidence:**
- Files exist: `src/lib/locales/{de,en,es,pl,ru,uk}/feed.json` and `search.json`
- `i18n.ts` only imports: auth, common, profile, settings, preferences, sidebar, companies, admin, admin-categories, categories, home, shorts, payments
- Missing: `feed` and `search` namespaces

**Fix:** Update `i18n.ts` to include feed and search namespaces:

```typescript
// i18n.ts - Add to imports array
const [
  auth,
  common,
  // ... existing imports ...
  payments,
  feed,      // ADD
  search     // ADD
] = await Promise.all([
  // ... existing imports ...
  import(`./src/lib/locales/${locale}/payments.json`),
  import(`./src/lib/locales/${locale}/feed.json`),      // ADD
  import(`./src/lib/locales/${locale}/search.json`)     // ADD
])

// Add to messages object
return {
  locale,
  messages: {
    // ... existing namespaces ...
    payments: payments.default,
    feed: feed.default,        // ADD
    search: search.default     // ADD
  }
}
```

---

### 2. HIGH: UI Overlap Issue - CTA Badge Position Conflict

**File:** `src/components/feed/feed-card.tsx:162-169`
**Problem:** The CTA badge is positioned at `top-3 right-3`, but the distance badge (line 111-118) is also positioned to the right side within the stats container at `top-3 left-3 right-3`. When both `short.distance` and `short.ctaLink` exist, the CTA badge will overlap with the distance badge.

**Current code:**
```typescript
// Line 96-119: Stats badges container includes distance badge on right
<div className="absolute top-3 left-3 right-3 flex justify-between items-start">
  <div className="flex gap-2">{/* views, likes */}</div>
  {short.distance !== null && (
    <Badge ...>  {/* Distance badge on RIGHT */}
  )}
</div>

// Line 162-169: CTA badge also positioned top-right
{short.ctaLink && (
  <div className="absolute top-3 right-3">
    <Badge>CTA</Badge>  {/* OVERLAPS with distance! */}
  </div>
)}
```

**Fix:** Move CTA badge inside the stats container and adjust positioning:

```typescript
// Option A: Combine in one container
<div className="absolute top-3 left-3 right-3 flex justify-between items-start">
  <div className="flex gap-2">{/* views, likes */}</div>
  <div className="flex gap-2">
    {short.ctaLink && (
      <Badge className="bg-primary text-primary-foreground text-xs">CTA</Badge>
    )}
    {short.distance !== null && (
      <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
        <MapPin className="h-3 w-3 mr-1" />
        {short.distance < 1 ? `${Math.round(short.distance * 1000)}m` : `${short.distance.toFixed(1)}km`}
      </Badge>
    )}
  </div>
</div>
```

---

### 3. MEDIUM: Hardcoded "CTA" text not translated

**File:** `src/components/feed/feed-card.tsx:165`
**Problem:** The text "CTA" is hardcoded and not using translations. This violates i18n practices.

**Current:**
```typescript
<Badge className="bg-primary text-primary-foreground text-xs">
  CTA
</Badge>
```

**Fix:** Use translation key:
```typescript
const { t } = useTranslations('feed')
// ...
<Badge className="bg-primary text-primary-foreground text-xs">
  {t('card.cta')}
</Badge>
```

And add to feed.json:
```json
{
  "card": {
    "cta": "CTA"
  }
}
```

---

## Summary

| Category | Issue | Severity |
|----------|-------|----------|
| i18n | feed/search namespaces not in i18n.ts config | BLOCKER |
| UI | CTA badge overlaps with distance badge | HIGH |
| i18n | Hardcoded "CTA" text | MEDIUM |

**Required Changes:**
1. Update `i18n.ts` to include `feed` and `search` namespaces
2. Fix CTA badge positioning to avoid overlap with distance badge
3. Replace hardcoded "CTA" with translation

---

**Next Steps:** Fix the issues above and create a new commit for review.
