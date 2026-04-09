# Context: Architecture Plan

> **SOURCE:** `.ai-project-planner/projects/videoshorts/architecture-plan.md`
> **Import:** 2025-12-31
> **Status:** Reference

---

Ten plik jest referencją do planu architektury projektu VideoShorts.

**Pełny plan architektury znajduje się w:**
`.ai-project-planner/projects/videoshorts/architecture-plan.md`

## Quick Reference

### Stack Technologiczny

**Frontend:**
- Next.js 14+ (App Router, RSC)
- React 19, TypeScript 5.3+
- Tailwind CSS 3.4+, shadcn/ui
- @vidstack/react (HLS player)
- @tanstack/react-query

**Backend:**
- Next.js API Routes + Server Actions
- NextAuth.js 5+ (Auth.js)
- Prisma 5.8+
- Inngest (background jobs)

**Database:**
- Neon DB (PostgreSQL 15+)
- PostGIS (geolocation)
- pg_trgm (fuzzy search)

**Storage:**
- Cloudflare R2 (video-raw, video-hls, images)
- Cloudflare CDN

### External Services (Stage 03)

| Service | Purpose |
|---------|---------|
| **Cloudflare R2** | Video storage (raw + HLS) |
| **Qencode** | Video transcoding (HLS output) |
| **Przelewy24** | Primary payment provider (PL) |
| **Tpay** | Secondary payment provider (PL) |
| **Inngest** | Background jobs, webhooks |
| **Resend** | Email notifications |

### Video Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  R2 Raw     │────▶│   Qencode   │
│  (Upload)   │     │  (24h TTL)  │     │ (transcode) │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◀────│  CF CDN     │◀────│  R2 HLS     │
│ (Playback)  │     │  (cached)   │     │  (public)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Key Environment Variables (Stage 03)

```
# R2 Storage
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_VIDEO_RAW_BUCKET
R2_VIDEO_HLS_BUCKET

# Qencode
QENCODE_API_KEY
QENCODE_WEBHOOK_SECRET

# Payments
PRZELEWY24_MERCHANT_ID
PRZELEWY24_CRC
PRZELEWY24_API_KEY
TPAY_MERCHANT_ID
TPAY_SECURITY_CODE
TPAY_API_KEY

# Inngest
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
```
