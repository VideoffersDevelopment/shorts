# Etap 7: Analytics

**Projekt:** VideoShorts
**Priorytet:** P1 (High - Post-MVP)
**Zależności:** Etap 3 (Shorts + Payments), Etap 4 (Feed)
**Szacowany czas:** 2 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

Dashboard analytics dla firm: statystyki shortsów (views, engagement, watch time), demographics (location heatmap), oraz integracja PostHog dla advanced analytics z video events. To etap który daje firmom insights do optymalizacji treści.

---

## 2. Funkcjonalności

### 2.1 Company Dashboard (Overview)

**KPIs (Cards):**
- Total Views (wszystkie shorty)
- Unique Viewers
- Average Watch Time (seconds)
- Engagement Rate ((likes + comments) / views)
- Followers Count
- Active Shorts (published, nie archived)

**Charts:**
- Views/day (ostatnie 30 dni, line chart)
- Engagement breakdown (pie chart: likes, comments, CTA clicks)
- Top performing shorts (bar chart: views DESC, top 5)

**Filters:**
- Date range: 7 days, 30 days, 90 days, All time
- Compare periods (optional, post-MVP)

### 2.2 Stats per Short

**Detail page: `/dashboard/shorts/[id]/analytics`**

**Metrics:**
- Views (total, unique)
- Watch time:
  - Average
  - Median
  - Distribution chart (0-25%, 25-50%, 50-75%, 75-100%)
- Engagement:
  - Likes (breakdown per emoji type)
  - Comments (count + top comments)
  - CTA clicks (jeśli set)
- Retention curve (PostHog video events):
  - X-axis: time (seconds)
  - Y-axis: % viewers still watching
  - Identify drop-off points
  - Data from `video_progress` PostHog events

**Demographics:**
- Geographic distribution:
  - Mapbox heatmap (viewer locations)
  - Top cities (table: city, views, %)
- Device breakdown (mobile vs desktop)
- Referral sources (jeśli CTA link kliknięty)

**Export:**
- CSV download (all metrics)
- Date range selector

### 2.3 Video Analytics (PostHog Events)

**Video Performance Events:**
- `video_loaded` - time to first frame
- `video_progress` - fired at 10%, 25%, 50%, 75%, 90% progress
- `video_completed` - watched to end
- `video_error` - playback errors
- `video_quality_change` - HLS quality adaptation (1080p, 720p, 480p)

**Retention Curve (from PostHog):**
- Aggregate `video_progress` events per second
- Calculate drop-off percentages
- Display jako line chart
- Query: `posthog.query({ event: 'video_progress', properties: { shortId } })`

### 2.4 PostHog Integration

**Product Analytics:**
- Custom events:
  - `short_viewed` (shortId, companyId, watchTime, completed)
  - `short_liked` (shortId, likeType)
  - `short_commented` (shortId)
  - `cta_clicked` (shortId, ctaLink)
  - `company_followed` (companyId)

**Dashboards:**
- Embedded PostHog dashboard w `/dashboard/analytics/advanced`
- Pre-configured funnels:
  - View → Like → Comment
  - View → CTA Click
- Session replay (dla debugging UX)

**Feature flags:**
- A/B testing (post-MVP)
- Gradual rollouts

### 2.5 Global Stats (Admin)

**Admin dashboard: `/admin/stats`**

**Platform metrics:**
- Total users, companies, shorts
- Revenue metrics:
  - Total revenue (sum payments)
  - Revenue per day (chart)
  - MRR (monthly recurring revenue)
  - ARPU (average revenue per user)
- Engagement metrics:
  - DAU, WAU, MAU
  - Average session time
  - Bounce rate
- Content metrics:
  - Shorts published per day
  - Average views per short
  - Top categories (by shorts count, views)

**PostHog embed:**
- Global dashboards (user flows, funnels)
- Core Web Vitals (Vercel Analytics)

---

## 3. User Stories

### US-07-01: View Dashboard (Company)
**Jako** firma
**Chcę** zobaczyć dashboard z KPIs
**Aby** śledzić performance moich shortsów

**Kryteria akceptacji:**
- [ ] Strona `/dashboard` (home dla firmy)
- [ ] KPI cards: total views, unique viewers, avg watch time, engagement rate, followers, active shorts
- [ ] Charts: views/day (30 dni), engagement breakdown, top shorts
- [ ] Date range filter (7d, 30d, 90d, all)
- [ ] Real-time updates (refresh on nav)

### US-07-02: View Short Analytics
**Jako** firma
**Chcę** zobaczyć szczegółowe stats shorta
**Aby** zrozumieć co działa

**Kryteria akceptacji:**
- [ ] Link "View Analytics" w shorts list
- [ ] Strona `/dashboard/shorts/[id]/analytics`
- [ ] Metrics: views, watch time (avg, median, distribution), engagement (likes, comments, CTA clicks)
- [ ] Retention curve (PostHog video events, line chart)
- [ ] Demographics: location heatmap (Mapbox), top cities, device breakdown
- [ ] Export CSV button

### US-07-03: View Retention Curve
**Jako** firma
**Chcę** zobaczyć retention curve shorta
**Aby** zidentyfikować drop-off points

**Kryteria akceptacji:**
- [ ] Retention curve chart (PostHog video_progress events)
- [ ] X-axis: time (seconds), Y-axis: % viewers
- [ ] Hover: tooltip z exact % at that second
- [ ] Highlight drop-off points (> 20% drop w 5s)
- [ ] Suggestions: "Users drop off at 0:15, consider shorter intro"

### US-07-04: View Global Stats (Admin)
**Jako** admin
**Chcę** zobaczyć statystyki całej platformy
**Aby** monitorować zdrowie biznesu

**Kryteria akceptacji:**
- [ ] Admin dashboard: `/admin/stats`
- [ ] Platform metrics (users, companies, shorts, revenue)
- [ ] Charts: revenue/day, shorts published/day, DAU/WAU/MAU
- [ ] PostHog embed (global dashboards)
- [ ] Vercel Analytics embed (Core Web Vitals)

---

## 4. Wymagania Techniczne

### 4.1 Tracking Events

**View tracking:**
```typescript
// Increment view counter (deduplicated by sessionId)
POST /api/shorts/:id/view
Body: {sessionId, watchTime, completed: boolean}

// Update ShortStats
await prisma.shortStats.upsert({
  where: { shortId },
  update: {
    views: { increment: 1 },
    uniqueViews: { increment: isUnique ? 1 : 0 },
    avgWatchTime: calculateRunningAverage(watchTime),
  },
  create: { shortId, views: 1, uniqueViews: 1, avgWatchTime: watchTime },
});
```

**PostHog events:**
```typescript
posthog.capture('short_viewed', {
  shortId,
  companyId,
  watchTime,
  completed: watchTime >= duration * 0.9,
  device: isMobile ? 'mobile' : 'desktop',
  location: { lat, lng },
});
```

### 4.2 Video Analytics (PostHog)

```typescript
// src/lib/video-analytics.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY!);

export async function getRetentionCurve(shortId: string) {
  // Query video_progress events from PostHog
  const result = await posthog.query({
    query: `
      SELECT
        properties.progress_seconds as second,
        count(distinct distinct_id) as viewers
      FROM events
      WHERE event = 'video_progress'
        AND properties.shortId = '${shortId}'
      GROUP BY properties.progress_seconds
      ORDER BY properties.progress_seconds
    `,
  });

  const totalViewers = result.results[0]?.viewers || 1;

  // Transform to {second: number, percentage: number}[]
  return result.results.map((point: any) => ({
    second: point.second,
    percentage: (point.viewers / totalViewers) * 100,
  }));
}

// Track video progress in player component
export function trackVideoProgress(shortId: string, currentTime: number, duration: number) {
  const progressPercent = Math.floor((currentTime / duration) * 100);

  // Fire at key milestones
  if ([10, 25, 50, 75, 90].includes(progressPercent)) {
    posthog.capture('video_progress', {
      shortId,
      progress_percent: progressPercent,
      progress_seconds: Math.floor(currentTime),
      duration,
    });
  }
}
```

### 4.3 Dashboard Queries

```typescript
// Company KPIs
const kpis = await prisma.$queryRaw`
  SELECT
    SUM(ss.views) as totalViews,
    SUM(ss.uniqueViews) as uniqueViewers,
    AVG(ss.avgWatchTime) as avgWatchTime,
    SUM(ss.likes + ss.comments) / NULLIF(SUM(ss.views), 0) as engagementRate,
    COUNT(DISTINCT f.userId) as followers,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'PUBLISHED') as activeShorts
  FROM shorts s
  LEFT JOIN short_stats ss ON s.id = ss.shortId
  LEFT JOIN follows f ON s.companyId = f.companyId
  WHERE s.companyId = ${companyId}
`;
```

### 4.4 API Endpoints

```
GET    /api/companies/me/stats
  Returns: {kpis, charts: {viewsPerDay, topShorts, engagementBreakdown}}

GET    /api/shorts/:id/analytics
  Returns: {metrics, retentionCurve, demographics}

GET    /api/admin/stats
  Returns: {platform metrics, revenue, engagement}
```

---

## 5. Kryteria Akceptacji

- [ ] Company dashboard pokazuje KPIs (views, engagement, followers)
- [ ] Charts: views/day, top shorts, engagement breakdown
- [ ] Short analytics page: detailed metrics, retention curve, demographics
- [ ] PostHog video analytics retention curve działa
- [ ] Location heatmap (Mapbox) pokazuje viewer locations
- [ ] CSV export działa
- [ ] PostHog events tracked (view, like, comment, CTA click, video_progress)
- [ ] Admin global stats dashboard
- [ ] Vercel Analytics embed (Core Web Vitals)

---

## 6. Zależności

- **PostHog:** Account + project key (etap 1 setup), video events tracking
- **Mapbox:** Heatmap API (etap 2 setup)
- **@vidstack/react:** Video player with event hooks for analytics
- Etap 3: Shorts published, stats tracking setup
- Etap 4: Feed views tracking

---

## 7. Harmonogram

### Tydzień 1: Company Dashboard
- **Dni 1-2:** KPIs queries, dashboard layout
- **Dni 3-4:** Charts (views/day, top shorts, engagement)
- **Dzień 5:** Date range filters, real-time updates

### Tydzień 2: Short Analytics + Video Events
- **Dni 1-2:** Short analytics page, metrics
- **Dni 3-4:** PostHog video analytics retention curve, demographics heatmap
- **Dzień 5:** Admin global stats, PostHog embed

---

## 8. Historia Zmian

| Data       | Wersja | Autor            | Zmiany                |
| ---------- | ------ | ---------------- | --------------------- |
| 2025-11-28 | 1.0    | AI Stage Planner | Initial specification |
| 2025-12-30 | 1.1    | AI Project Modifier | Migration: Mux Data → PostHog video events |

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
