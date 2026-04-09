# Brief: Shorts Upload + Payments

> **SOURCE:** `.ai-project-planner/projects/videoshorts/stages/stage-03-shorts-payments/spec.md`
> **Import:** 2025-12-31
> **Status:** Synchronized

---

# Etap 3: Shorts Upload + Payments

**Projekt:** VideoShorts
**Priorytet:** P0 (Critical - MVP Core)
**Zależności:** Etap 1 (Core + Auth), Etap 2 (Companies)
**Szacowany czas:** 3 tygodnie
**Status:** Planowany

---

## 1. Cel Etapu

Implementacja core business logic: upload shortsów przez firmy, integracja Serverless Video Pipeline (Cloudflare R2 + Qencode) dla video processing, elastyczny system płatności z wieloma providerami (Przelewy24, Tpay) w architekturze pay-per-video, oraz cykl życia shorta (draft → payment → processing → published). To najważniejszy etap MVP - umożliwia monetyzację platformy.

### Kluczowe Wartości:

- Direct upload do Cloudflare R2 (skalowalność, brak obciążenia serwera)
- Qencode dla transkodowania HLS (serverless, pay-per-use)
- Multi-provider payment gateway dla smooth payment flow
- Webhook-driven workflow (asynchroniczny, niezawodny)
- Transparentny status tracking dla firmy

---

## 2. Funkcjonalności

### 2.1 Upload Shorta (Draft)

**Multi-step wizard:**

1. **Video Upload:**
   - Drag & drop lub file picker
   - Validation: MP4/MOV/WebM, max 60s, max 100MB
   - Client-side checks przed uploadem
   - Direct upload do R2 video-raw bucket (presigned PUT URL)
   - Progress bar (real-time upload progress)
   - Aspect ratio detection (warning jeśli nie 9:16)

2. **Metadata:**
   - Tytuł (required, max 100 znaków)
   - Opis (optional, max 500 znaków)
   - Kategoria (dropdown, inherited z company)
   - Tagi (autocomplete, max 10 tags)
   - Lokalizacja (Mapbox, default: company location)
   - CTA Link (optional, URL z UTM tracking)

3. **Thumbnail:**
   - Auto-extracted z pierwszej klatki video (Qencode)
   - Lub custom upload do R2 (1080x1920, max 2MB)
   - Preview przed zapisaniem

4. **Review:**
   - Podsumowanie wszystkich danych
   - Video preview (HLS player)
   - Edit buttons dla każdej sekcji
   - Save as Draft button

**Status: DRAFT**

- Short zapisany w DB, niewidoczny publicznie
- Można wrócić do edycji później
- Max 10 drafts per company

### 2.2 Publish Flow (Payment & Credits)

**Publication Credits System:**

- Firma posiada `publicationCredits` (liczba dostępnych publikacji)
- Źródła kredytów: pakiety, prezenty, promocje, inne
- Jedna publikacja = -1 credit
- Historia transakcji kredytów (audit trail)

**Publication Controller:**

- Weryfikacja dostępnych kredytów przed publikacją
- Kontrola reguł publikacji (weryfikacja firmy, limity)
- Zarządzanie cyklem publikacji
- Lokalizacja: `src/lib/publication/publication-controller.ts`

**Initiate publish (z kredytami):**

- Button "Publish Short" w draft view
- Sprawdzenie `publicationCredits > 0`
- Jeśli kredyty dostępne:
  - Zmniejszenie `publicationCredits` o 1
  - Status: DRAFT → PROCESSING
  - Rozpoczęcie transkodowania (Qencode)
- Jeśli brak kredytów:
  - Redirect do Payment Gateway Checkout (zakup pakietu lub pojedyncza publikacja)
  - Price: 5 PLN/short (configurable w admin settings)
  - Pre-filled company data (z VIES)
  - Invoice auto-generated po płatności

**Payment Gateway Checkout (zakup kredytów):**

- Multi-provider system (Przelewy24, Tpay)
- Provider selection (domyślny: Przelewy24, fallback: Tpay)
- One-time payment (no subscription)
- Payment methods Przelewy24: BLIK, przelew bankowy, karty, Google Pay
- Payment methods Tpay: BLIK, przelewy, karty, Apple Pay
- Success URL: `/dashboard/shorts/[id]/publishing` lub `/dashboard/credits`
- Cancel URL: `/dashboard/shorts/[id]` (wraca do draftu)

**Webhook handling (per provider):**

- `payment.succeeded` →
  - Dodanie kredytów do `publicationCredits`
  - Utworzenie `CreditTransaction` (audit)
  - Jeśli linked z shortem: auto-publish
- `payment.failed` → Email notification, retry option
- Idempotency (webhook replay safe per provider)

**Status flow:**

- Z kredytami: DRAFT → PROCESSING → PUBLISHED
- Bez kredytów: DRAFT → PENDING_PAYMENT → PROCESSING → PUBLISHED

### 2.3 Video Processing (Qencode + R2)

**Qencode Transcode Job:**

- Triggered after payment/credits confirmed
- API call to Qencode with:
  - Input: R2 video-raw presigned URL (read access)
  - Output: R2 video-hls bucket path
  - Profile settings:
    - Format: HLS
    - Segments: 4-6 seconds
    - Codec: H.264 High/Main profile
    - Resolutions:
      - 1080p: 4500 kbps, 1080x1920
      - 720p: 2500 kbps, 720x1280
      - 480p: 1000 kbps, 480x854
    - Aspect ratio: 9:16
- Returns qencodeTaskId for tracking

**Processing time:**

- Expected: 2-5 min dla 60s video
- Max: 15 min (timeout, retry)
- Real-time status updates via polling Qencode API or SSE

**Webhook handling:**

- `POST /api/webhooks/qencode` - transcoding callback
- On success:
  - Update Short: hlsPlaylistUrl, duration, thumbnailUrl
  - Status: PROCESSING → PUBLISHED
  - Cleanup: delete raw video from video-raw bucket
- On error:
  - Increment retryCount
  - If retryCount < 3: re-trigger transcoding
  - If retryCount >= 3: refund credits, notify user

**Output Structure (R2 video-hls bucket):**

```
shorts/{shortId}/
├── master.m3u8          # Master playlist
├── 1080p/
│   ├── playlist.m3u8    # 1080p playlist
│   └── segment_*.ts     # 1080p segments
├── 720p/
│   ├── playlist.m3u8
│   └── segment_*.ts
├── 480p/
│   ├── playlist.m3u8
│   └── segment_*.ts
└── thumbnail.jpg        # Auto-extracted
```

**Status: PROCESSING → PUBLISHED**

### 2.4 Published Short

**Auto-publish:**

- Short widoczny w feed (etap 4)
- Notification email + in-app
- Company dashboard: "Your short is live!"
- publishedAt timestamp zapisany

**Short detail page:**

- URL: `/shorts/[id]`
- Video player (@vidstack/react HLS, adaptive bitrate)
- Metadata: title, description, category, tags
- Company card (name, logo, link to profile)
- Location map (Mapbox)
- CTA button (jeśli ustawiony)
- Stats: views, likes, comments (placeholder w tym etapie)

**Player features:**

- Autoplay (jeśli w feedzie)
- Controls: play/pause, volume, fullscreen
- Mobile: vertical orientation lock
- Desktop: 9:16 aspect ratio w center

### 2.5 Shorts Management (Dashboard)

**Lista shortsów:**

- Table view: thumbnail, title, status, stats, actions
- Filters: status (all, draft, published, archived), date range
- Search: title, description
- Sort: newest, oldest, most viewed

**Actions:**

- View (detail page)
- Edit metadata (tylko draft lub published)
- Duplicate (create copy as draft)
- Archive (manual archive przed 30 dni)
- Delete (soft delete, tylko draft)

**Detail view:**

- Full metadata
- Status timeline (draft → payment → processing → published)
- Stats (views, likes, comments - etap 5-7)
- Edit button (modal z formularzem)

### 2.6 Lifecycle (30-Day Auto-Archive)

**Auto-archivization:**

- Cron job (daily 3 AM): znajdź shorty published 30 dni temu
- 7 dni przed: email reminder "Your short expires in 7 days"
- Day 30: status → ARCHIVED
- Archived short:
  - Niewidoczny w feed
  - Widoczny w company profile (sekcja "Archived")
  - Nadal dostępny przez direct link
  - Można odnowić (kolejna płatność)

**Renewal flow:**

- Button "Renew Short" w archived short view
- Payment Gateway Checkout (kolejne 5 PLN)
- Po payment: publishedAt += 30 days, status → PUBLISHED
- Short wraca do feedu

---

## 3. User Stories

### US-03-01: Upload Video (Draft)

**Jako** firma (zweryfikowana)
**Chcę** upload'ować video shorta
**Aby** przygotować go do publikacji

**Kryteria akceptacji:**

- [ ] Button "Create Short" w dashboard
- [ ] Upload wizard (multi-step: video → metadata → thumbnail → review)
- [ ] Video upload: drag & drop, file picker, validation (format, size, duration)
- [ ] Direct upload do R2 video-raw bucket (presigned PUT URL), progress bar
- [ ] Client-side validation przed uploadem (aspect ratio warning jeśli nie 9:16)
- [ ] Po upload: rawVideoKey saved w Short record
- [ ] Metadata form: title (required), description, category, tags (autocomplete), location (Mapbox), CTA link
- [ ] Thumbnail: auto-generated przez Qencode lub custom upload do R2
- [ ] Review step: podsumowanie + video preview
- [ ] Save as Draft → Short record created (status: DRAFT)
- [ ] Redirect do `/dashboard/shorts/[id]` (draft view)

### US-03-02: Publish Short (Payment)

**Jako** firma
**Chcę** opublikować shorta
**Aby** był widoczny dla użytkowników

**Kryteria akceptacji:**

- [ ] Button "Publish Short" w draft view
- [ ] Click → create Payment Gateway Checkout Session (provider selected)
- [ ] Redirect do Payment Gateway Checkout (price: 5 PLN)
- [ ] Pre-filled: company name, NIP, address (z VIES)
- [ ] Payment methods (Przelewy24): BLIK, przelew, karty, Google Pay
- [ ] Success → redirect `/dashboard/shorts/[id]/publishing` (status page)
- [ ] Cancel → redirect `/dashboard/shorts/[id]` (draft view)
- [ ] Webhook `payment.succeeded` → status: PENDING_PAYMENT → PROCESSING
- [ ] Email notification: "Payment received, processing video..."
- [ ] Invoice auto-generated, link w email

### US-03-03: Video Processing Status

**Jako** firma
**Chcę** widzieć status processingu video
**Aby** wiedzieć kiedy short będzie live

**Kryteria akceptacji:**

- [ ] Status page: `/dashboard/shorts/[id]/publishing`
- [ ] Timeline visualization:
  - ✅ Draft created
  - ✅ Payment received
  - 🔄 Processing video... (spinner)
  - ⏳ Publishing soon
- [ ] Real-time updates (polling co 5s lub SSE)
- [ ] Expected time: "Usually takes 2-5 minutes"
- [ ] Gdy ready: auto-redirect do `/shorts/[id]` (published)
- [ ] Email notification: "Your short is live!"
- [ ] Error handling: jeśli transcode fail → email, retry option lub refund

### US-03-04: View Published Short

**Jako** użytkownik (przeglądający)
**Chcę** obejrzeć short
**Aby** poznać ofertę firmy

**Kryteria akceptacji:**

- [ ] URL: `/shorts/[id]`
- [ ] Layout: video player (full width na mobile, center 9:16 na desktop)
- [ ] @vidstack/react HLS player: autoplay, controls, adaptive bitrate
- [ ] Metadata poniżej: title, description, category badge, tags
- [ ] Company card: logo, name, location, link do profilu
- [ ] Location map (Mapbox, clickable)
- [ ] CTA button (jeśli set): opens w nowym tab, tracked click
- [ ] Stats: views count, like button (placeholder w tym etapie)
- [ ] Share button (placeholder, post-MVP)
- [ ] SEO: meta tags, OG image (thumbnail)

### US-03-05: Edit Short Metadata

**Jako** firma
**Chcę** edytować metadata shorta
**Aby** poprawić tytuł, opis lub CTA

**Kryteria akceptacji:**

- [ ] Button "Edit" w dashboard shorts list lub detail view
- [ ] Modal z formularzem (fields: title, description, tags, CTA link)
- [ ] Nie można zmienić: video, thumbnail, kategoria (bez re-upload)
- [ ] Validation: title required, max lengths
- [ ] Save → API call → success toast, table updated
- [ ] Changes visible immediately na public short page

### US-03-06: Renew Expired Short

**Jako** firma
**Chcę** odnowić zarchiwizowany short
**Aby** był znowu widoczny w feedzie

**Kryteria akceptacji:**

- [ ] Archived shorts visible w dashboard (filter: "Archived")
- [ ] Badge "Archived [Date]" na short card
- [ ] Button "Renew for 5 PLN"
- [ ] Click → Payment Gateway Checkout (kolejna płatność)
- [ ] Po payment success: publishedAt += 30 days, status → PUBLISHED
- [ ] Short wraca do feedu
- [ ] Email notification: "Your short is live again!"

---

## 4. Wymagania Biznesowe

### 4.1 Upload Limits

- Max 100MB per file
- Max 60 sekund duration
- Formaty: MP4 (H.264), MOV (ProRes), WebM (VP9)
- Aspect ratio: 9:16 zalecane (warning jeśli inne, ale allow)
- Max 10 drafts per company (limit spamu)

### 4.2 Pricing

- 5 PLN per short (configurable w admin settings)
- VAT: 23% (Polska, payment provider auto-calculation)
- No refunds (poza transcode failures)
- Invoice auto-generated (payment provider)

### 4.3 Lifecycle

- Published shorts: 30 dni visibility
- Reminder email: 7 dni przed expiry
- Auto-archive: day 30
- Archived shorts: dostępne przez direct link, niewidoczne w feed
- Renewal: kolejne 30 dni za 5 PLN (unlimited renewals)

### 4.4 Weryfikacja

- Tylko verified companies mogą publish'ować
- Drafts: bez verification (można tworzyć zawsze)
- Publish button disabled jeśli company not verified

---

## 5. Kryteria Akceptacji (Etap jako całość)

### Funkcjonalne:

- [ ] Firma może upload'ować video (direct upload do R2 video-raw bucket)
- [ ] Upload wizard działa (video → metadata → thumbnail → review)
- [ ] Draft można zapisać i edytować później
- [ ] Publish button tworzy Payment Gateway Checkout Session (Przelewy24/Tpay)
- [ ] Płatność przez payment provider działa (BLIK, przelew, karty)
- [ ] Webhook `payment.succeeded` aktualizuje status shorta
- [ ] Qencode transcode działa (webhook `job.completed`)
- [ ] Short auto-publikowany po transcode complete
- [ ] Published short widoczny na `/shorts/[id]`
- [ ] Video player działa (@vidstack/react HLS, adaptive bitrate, autoplay)
- [ ] Company dashboard pokazuje wszystkie shorty z statusami
- [ ] Metadata można edytować (title, description, tags, CTA)
- [ ] Auto-archive po 30 dniach
- [ ] Expiring reminder email 7 dni przed
- [ ] Renewal flow działa (kolejna płatność → extend 30 days)

### Niefunkcjonalne:

- [ ] Upload max 100MB, max 60s
- [ ] Transcode time < 5 min dla 60s video (p95)
- [ ] Payment redirect < 1s
- [ ] Video playback start < 2s (HLS buffering)
- [ ] Processing status updates w real-time (polling 5s)
- [ ] Invoice auto-generated (Payment provider, VAT 23%)

### Bezpieczeństwo:

- [ ] Tylko verified companies mogą publish
- [ ] Payment provider webhook signature verification (Przelewy24, Tpay)
- [ ] Qencode webhook verification (signed requests)
- [ ] File upload validation (format, size, duration)
- [ ] Rate limiting (max 10 uploads/hour per company)
- [ ] R2 presigned URLs expire after 1 hour

---

## 6. Zależności

### External Services:

- **Cloudflare R2:** Video storage (video-raw + video-hls buckets)
- **Qencode:** Video transcoding service (HLS output)
- **@vidstack/react:** Video player component
- **Przelewy24:** Primary payment provider dla polskiego rynku (account + API keys)
- **Tpay:** Secondary payment provider dla polskiego rynku (account + API keys)
- **Mapbox:** Location autocomplete (etap 2 setup)
- **Resend:** Email notifications (etap 1 setup)
- **Inngest:** Background jobs (event processing)

### Prerequisites:

- Etap 1: Auth, user profiles
- Etap 2: Company profiles, verification
- Cloudflare R2 buckets created (video-raw, video-hls)
- R2 CORS configuration for localhost:3000
- Qencode account + API key
- Przelewy24 account + sandbox credentials
- Tpay account + sandbox credentials
- Payment provider tax configuration
- Webhooks endpoints configured (Przelewy24, Tpay, Qencode)

---

## 7. Out of Scope (Nie w tym etapie)

- Feed z shortsami (Etap 4)
- Search i filtry (Etap 4)
- Likes, comments (Etap 5)
- Analytics dashboard (Etap 7)
- Moderation (Etap 6)
- Shares (Post-MVP)
- Multiple videos per checkout (Post-MVP)
- Subscription model (Post-MVP)
