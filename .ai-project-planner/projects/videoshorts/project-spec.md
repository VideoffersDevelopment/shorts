# VideoShorts - Specyfikacja Projektu

**Wersja:** 1.0
**Data:** 2025-11-28
**Status:** Draft

---

## 1. Executive Summary

VideoShorts to platforma SaaS umożliwiająca firmom publikację krótkich filmów promocyjnych (do 60 sekund) w formacie vertical video (9:16). System działa na modelu pay-per-video, gdzie firmy płacą za publikację każdego shorta przez elastyczny system płatności z wieloma providerami (obecnie: Przelewy24, Tpay, z możliwością dodawania kolejnych), a użytkownicy przeglądają treści za darmo w spersonalizowanym feedzie z filtrowaniem po lokalizacji (Mapbox) i kategoriach.

### Kluczowe Wartości Biznesowe:
- Niski próg wejścia dla firm (płatność za publikację, bez subskrypcji)
- Targetowanie lokalne dzięki geolokalizacji
- Moderacja automatyczna + manualna dla jakości treści
- Analytics w czasie rzeczywistym dla firm
- Mobile-first experience dla użytkowników

### Docelowa Grupa:
- **Użytkownicy końcowi:** Konsumenci poszukujący lokalnych produktów/usług
- **Firmy:** Małe i średnie przedsiębiorstwa chcące promować produkty w formie video
- **Administratorzy:** Zespół moderacyjny i operacyjny

---

## 2. Cele Projektu i KPIs

### Cele Biznesowe:
1. Umożliwić firmom łatwe publikowanie video promocyjnych
2. Dostarczyć użytkownikom angażujący feed lokalnych treści
3. Zapewnić wysoką jakość treści przez moderację
4. Monetyzować platformę przez pay-per-video model

### KPIs (MVP):
- **Engagement:** Średni czas sesji > 3 min
- **Conversion:** 15% firm publikujących drugi short w ciągu 30 dni
- **Content Quality:** < 5% zgłoszonych shortsów
- **Technical:** 95% uptime, < 2s load time dla feedu
- **Moderation:** < 24h response time na zgłoszenia

---

## 3. Typy Użytkowników

### 3.1 User (Przeglądający)

**Uprawnienia:**
- Przeglądanie publicznych shortsów
- Filtrowanie i wyszukiwanie
- Reakcje (like, emoji)
- Komentowanie (z moderacją)
- Followowanie firm
- Zgłaszanie nieodpowiednich treści

**Ograniczenia:**
- Nie może publikować shortsów (tylko firmy)
- Limit 100 komentarzy/dzień (spam prevention)
- Nie widzi prywatnych dislikes innych użytkowników

### 3.2 Company (Firma)

**Uprawnienia:**
- Wszystkie uprawnienia User +
- Tworzenie profilu firmowego
- Upload shortsów (po weryfikacji NIP)
- Płatność przez system płatności (Przelewy24, Tpay)
- Dostęp do dashboardu analytics
- Zarządzanie shortsami (edycja metadanych, archiwizacja)
- Odpowiadanie na komentarze pod swoimi shortsami
- Eksport statystyk

**Ograniczenia:**
- Max 10 shortsów w kolejce do publikacji
- Max 100MB per upload
- Wymagana weryfikacja VIES przed pierwszą publikacją
- Nie może usuwać komentarzy (tylko odpowiadać)

### 3.3 Admin

**Uprawnienia:**
- Wszystkie uprawnienia Company +
- Moderacja kolejki zgłoszeń
- Banowanie/zawieszanie użytkowników
- Usuwanie shortsów/komentarzy
- Zarządzanie kategoriami
- Dostęp do globalnych statystyk
- Konfiguracja systemu (limity, progi moderacji)
- Zarządzanie weryfikacją firm

**Ograniczenia:**
- Audit log wszystkich akcji moderacyjnych
- Nie może edytować treści (tylko approve/reject/delete)

---

## 4. Wymagania Funkcjonalne

### 4.1 Moduł: Authentication & Users

#### F-AUTH-001: Rejestracja
- Email + hasło (bcrypt, min 8 znaków)
- OAuth: Google, Facebook
- Weryfikacja email (link aktywacyjny)
- CAPTCHA na formularzu rejestracji

#### F-AUTH-002: Logowanie
- Email/hasło lub OAuth
- Remember me (30 dni)
- Rate limiting: 5 prób/15 min
- 2FA opcjonalne (TOTP)

#### F-AUTH-003: Profil Użytkownika
- Avatar (upload do R2, max 2MB)
- Bio (max 500 znaków)
- Lokalizacja (Mapbox autocomplete)
- Preferencje (kategorie, powiadomienia)
- Dark mode toggle

### 4.2 Moduł: Companies

#### F-COMP-001: Rejestracja Firmy
- Upgrade z konta User
- NIP (walidacja format)
- Weryfikacja VIES API (automatyczna)
- Dane firmowe: nazwa, adres, email kontaktowy
- Logo (max 5MB, min 200x200px)
- Banner (max 10MB, 1920x400px)

#### F-COMP-002: Profil Firmowy
- Publiczny profil z wszystkimi shortsami
- Opis firmy (max 2000 znaków, markdown)
- Linki: website, social media
- Kategoria główna + subcategories
- Godziny otwarcia (opcjonalne)
- Statystyki: liczba shortsów, followers, total views

#### F-COMP-003: Weryfikacja
- Auto-weryfikacja przez VIES
- Jeśli fail: manual review przez admina
- Badge zweryfikowanej firmy
- Re-weryfikacja co 6 miesięcy (background job)

### 4.3 Moduł: Shorts (Content)

#### F-SHORT-001: Upload Shorta
- Direct upload do Cloudflare R2 (client → R2 video-raw bucket)
- Formaty: MP4, MOV, WebM
- Max 60 sekund, max 100MB
- Aspect ratio: 9:16 (auto-detect + warning jeśli inne)
- Thumbnail: auto-extracted z pierwszej klatki video lub custom upload do R2

#### F-SHORT-002: Metadata
- Tytuł (required, max 100 znaków)
- Opis (max 500 znaków)
- Kategoria (required, single select)
- Tagi (max 10, autocomplete)
- Lokalizacja (Mapbox, coordinates + address)
- CTA: link do produktu (opcjonalny, z UTM tracking)

#### F-SHORT-003: Transkodowanie
- Qencode transcode: 1080p (4500kbps), 720p (2500kbps), 480p (1000kbps)
- HLS streaming (4-6s segments, H.264 High/Main profile)
- Output do R2 video-hls bucket (public CDN)
- Webhook callback po zakończeniu
- Retry na failure (max 3 razy)

#### F-SHORT-004: Publikacja
- Payment required: Payment gateway checkout (5 PLN/short)
- Obsługiwane bramy: Przelewy24, Tpay (możliwość dodawania kolejnych)
- Status workflow: DRAFT → PENDING_PAYMENT → PROCESSING → PUBLISHED
- Auto-publish po successful payment + transcode
- Powiadomienie email + in-app

#### F-SHORT-005: Cykl Życia
- Published: widoczny w feedzie
- Auto-archiwizacja po 30 dniach
- Email 7 dni przed archiwizacją z opcją odnowienia (kolejna płatność)
- Archived: nie widoczny w feedzie, dostępny w historii firmy
- Deleted: soft delete, tylko admin może hard delete

### 4.4 Moduł: Feed & Discovery

#### F-FEED-001: Główny Feed
- Infinite scroll (20 shortsów per page)
- Default sort: algorytmiczny (recency + engagement + personal preferences)
- Prefetch następnej strony
- Lazy load video (autoplay w viewport)
- Mobile: vertical swipe, Desktop: scroll

#### F-FEED-002: Filtrowanie
- Lokalizacja: radius search (1km, 5km, 10km, 25km, 50km, cały kraj)
- Kategorie: multi-select
- Tagi: autocomplete + multi-select
- Tylko zweryfikowane firmy (toggle)

#### F-FEED-003: Sortowanie
- Najnowsze (created_at DESC)
- Popularne (views + likes w ostatnich 7 dniach)
- Trending (współczynnik: engagement rate w ostatnich 24h)
- Obserwowane (only followed companies)

#### F-FEED-004: Wyszukiwanie
- Full-text search: tytuł, opis, tagi, nazwa firmy
- PostgreSQL tsvector + trigram similarity
- Auto-suggestions (debounced)
- Historia wyszukiwań (per user, max 10)

#### F-FEED-005: Personalizacja
- Learning z interakcji: likes, watch time, skips
- Boost shortsów z preferowanych kategorii
- Geo-boost (wyżej shorty z bliższej lokalizacji)
- Diversity: max 2 shorty z tej samej firmy na pierwszej stronie

### 4.5 Moduł: Interactions

#### F-INT-001: Reakcje
- Like (publiczny, widoczny licznik)
- Dislike (prywatny, tylko do algorytmu)
- Emoji reactions (5 typów: 🔥, ❤️, 😂, 😮, 👏)
- Rate limiting: max 100 reakcji/min (spam protection)

#### F-INT-002: Komentarze
- Max 500 znaków
- Markdown support (bold, italic, links)
- Moderacja automatyczna: Perspective API (toxicity < 0.7)
- Jeśli toxicity >= 0.7: pending moderation
- Threading: max 2 poziomy (komentarz → odpowiedź)
- Sortowanie: newest, oldest, most liked
- Edycja: do 15 min po publikacji
- Usuwanie: tylko przez autora (soft delete) lub admina

#### F-INT-003: Followowanie
- Follow/unfollow firmy
- Lista obserwowanych w profilu
- Powiadomienia o nowych shortsach (opcjonalne)
- Feed z obserwowanych firm

#### F-INT-004: Zgłaszanie
- Powody: spam, inappropriate content, misleading, copyright, other
- Opis dodatkowy (max 500 znaków)
- Auto-blokada shorta po 10 unikalnych zgłoszeniach
- Powiadomienie do firmy i adminów
- Status tracking (pending, reviewed, resolved)

### 4.6 Moduł: Moderation & Reports

#### F-MOD-001: Kolejka Moderacji
- Auto-flagged przez Perspective API
- Zgłoszenia użytkowników
- Sortowanie: priority (liczba zgłoszeń DESC), date
- Perspective API scoring widoczny
- Quick actions: approve, reject, ban user, delete content

#### F-MOD-002: Content Moderation
- Preview shorta + metadata
- Historia zgłoszeń tego użytkownika/firmy
- Komentarze moderatora (internal notes)
- Akcje: approve (publish), reject (+ powód), delete, ban author
- Email notification do autora

#### F-MOD-003: User Moderation
- Ban (permanent): disable account
- Suspend (temporary): 7/30/90 dni
- Warning: email notification
- Historia akcji moderacyjnych (audit log)

### 4.7 Moduł: Payments

#### F-PAY-001: Publication Credits System
- User posiada `publicationCredits` (liczba dostępnych publikacji)
- Źródła kredytów: pakiety, prezenty, promocje, refundy, admin
- Publikacja shorta: -1 credit
- Historia transakcji (CreditTransaction model)
- Publication Controller zarządza regułami publikacji

#### F-PAY-002: Payment Gateway Integration
- Multi-provider payment system (Przelewy24, Tpay)
- Payment gateway abstraction layer (możliwość dodawania kolejnych providerów)
- Checkout dla zakupu kredytów (single payment: 5 PLN/short lub pakiety)
- Webhook handling per provider: payment.succeeded, payment.failed
- Retry logic na failed webhooks
- Idempotency keys
- Auto-dodanie kredytów po successful payment
- Provider selection logic (domyślny: Przelewy24, fallback: Tpay)

#### F-PAY-003: Fakturowanie
- Auto-generowanie faktur przez payment provider
- VAT według stawki krajowej
- Dane firmy z VIES
- Historia faktur w dashboardzie
- Download PDF

#### F-PAY-004: Payment History
- Lista wszystkich transakcji
- Status: pending, succeeded, failed, refunded
- Filter: date range, status
- Export CSV

### 4.8 Moduł: Analytics & Stats

#### F-ANA-001: Dashboard Firmy
- KPIs: total views, unique viewers, avg watch time, engagement rate
- Wykres: views/day (ostatnie 30 dni)
- Top performing shorts
- Demographics: location heatmap (Mapbox)
- Referral sources (jeśli CTA link)

#### F-ANA-002: Stats per Short
- Views (total, unique)
- Watch time (avg, median, distribution)
- Engagement: likes, comments, shares
- Retention curve (PostHog video_progress events)
- Geographic distribution (Mapbox heatmap)

#### F-ANA-003: Global Stats (Admin)
- PostHog dashboards
- Total users, companies, shorts
- Revenue metrics
- Moderation metrics
- Performance metrics (Core Web Vitals)

### 4.9 Moduł: Notifications

#### F-NOT-001: Email Notifications
- Resend + React Email templates
- Typy: welcome, verify email, new short published, short expiring, payment confirmation, moderation action
- Unsubscribe link (per type)
- Rate limiting: max 10 emails/day per user

#### F-NOT-002: In-App Notifications
- Bell icon z unread count
- Typy: new follower, comment reply, moderation action, short expiring
- Mark as read
- Max 50 notifications stored per user
- Real-time updates (polling każde 30s lub Server-Sent Events)

### 4.10 Moduł: Admin Panel

#### F-ADM-001: Dashboard
- Statystyki globalne (PostHog embed)
- Kolejka moderacji (count)
- Recent activity log
- System health (Vercel analytics)

#### F-ADM-002: Zarządzanie Kategoriami
- CRUD kategorii
- Hierarchia: kategoria → podkategoria
- Icon upload (max 1MB SVG)
- Sortowanie (drag & drop)

#### F-ADM-003: Konfiguracja Systemu
- Limity: max upload size, max shorts per company, etc.
- Progi moderacji: Perspective API threshold, auto-ban threshold
- Pricing: cena za short
- Feature flags (toggle funkcji)

---

## 5. Wymagania Niefunkcjonalne

### 5.1 Wydajność
- **NFR-PERF-001:** Feed load time < 2s (LCP)
- **NFR-PERF-002:** Video autoplay < 1s buffering
- **NFR-PERF-003:** Search results < 500ms
- **NFR-PERF-004:** API response time p95 < 1s

### 5.2 Skalowalność
- **NFR-SCALE-001:** Obsługa 10,000 concurrent users
- **NFR-SCALE-002:** 1,000 uploads/day
- **NFR-SCALE-003:** 100,000 videos w bazie
- **NFR-SCALE-004:** Horizontal scaling przez Vercel Edge

### 5.3 Dostępność
- **NFR-AVAIL-001:** 95% uptime (MVP), 99.9% (post-MVP)
- **NFR-AVAIL-002:** Graceful degradation (fallback do static thumbnails jeśli R2/Qencode down)
- **NFR-AVAIL-003:** Database backups daily (Neon auto-backup)

### 5.4 Bezpieczeństwo
- **NFR-SEC-001:** HTTPS everywhere
- **NFR-SEC-002:** OWASP Top 10 compliance
- **NFR-SEC-003:** Rate limiting na wszystkich endpoints
- **NFR-SEC-004:** SQL injection prevention (Prisma)
- **NFR-SEC-005:** XSS prevention (React auto-escape + DOMPurify dla markdown)
- **NFR-SEC-006:** CSRF tokens
- **NFR-SEC-007:** Secure password storage (bcrypt, cost 12)

### 5.5 Użyteczność
- **NFR-UX-001:** Mobile-first responsive design
- **NFR-UX-002:** WCAG 2.1 Level AA compliance
- **NFR-UX-003:** Dark mode support
- **NFR-UX-004:** i18n ready (tylko PL na start)
- **NFR-UX-005:** Touch-friendly controls (min 44x44px)

### 5.6 Zgodność Prawna
- **NFR-LEGAL-001:** RODO/GDPR compliance
- **NFR-LEGAL-002:** Cookie consent (non-essential cookies)
- **NFR-LEGAL-003:** Terms of Service + Privacy Policy
- **NFR-LEGAL-004:** Data retention policy (delete user data on request w 30 dni)
- **NFR-LEGAL-005:** VAT invoicing compliance

---

## 6. Wymagania Techniczne

### 6.1 Video Specifications
- **Format:** MP4 (H.264), MOV (ProRes), WebM (VP9)
- **Max duration:** 60 sekund
- **Max file size:** 100MB
- **Aspect ratio:** 9:16 (1080x1920 recommended)
- **Transcode outputs:** 1080p (4500kbps), 720p (2500kbps), 480p (1000kbps)
- **HLS segments:** 4-6 seconds, H.264 High/Main profile
- **Storage:** Cloudflare R2 (video-raw: private 24h TTL, video-hls: public CDN)
- **Delivery:** HLS przez Cloudflare CDN

### 6.2 Image Specifications
- **Logo:** Min 200x200px, max 5MB, PNG/JPG/WebP
- **Banner:** 1920x400px, max 10MB, PNG/JPG/WebP
- **Avatar:** Min 100x100px, max 2MB, PNG/JPG/WebP
- **Thumbnail:** Auto-extracted from video or custom upload (1080x1920, max 2MB)
- **Storage:** Cloudflare R2 + CDN

### 6.3 Browser Support
- **Desktop:** Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- **Mobile:** iOS Safari 15+, Chrome Android 100+
- **Progressive enhancement:** core functionality działa bez JS

### 6.4 API Rate Limits
- **Anonymous:** 100 req/15min
- **Authenticated User:** 1000 req/15min
- **Company:** 2000 req/15min
- **Admin:** unlimited
- **Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

---

## 7. Model Danych (High-Level ERD)

```
User
├─ id (UUID)
├─ email (unique)
├─ passwordHash (nullable - OAuth users)
├─ role (USER | COMPANY | ADMIN)
├─ publicationCredits (Int, default: 0)
├─ profile (1:1 UserProfile)
├─ companyProfile (1:1 CompanyProfile - nullable)
├─ creditTransactions (1:N CreditTransaction)
└─ createdAt, updatedAt

UserProfile
├─ userId (FK)
├─ displayName
├─ avatar (URL)
├─ bio
├─ location (geometry)
├─ preferences (JSON)
└─ darkMode (boolean)

CompanyProfile
├─ userId (FK)
├─ companyName
├─ nip
├─ viesVerified (boolean)
├─ logo (URL)
├─ banner (URL)
├─ description (markdown)
├─ category (FK)
├─ website
├─ socialLinks (JSON)
└─ verifiedAt

Short
├─ id (UUID)
├─ companyId (FK)
├─ qencodeTaskId (Qencode transcoding task ID)
├─ hlsPlaylistUrl (R2 public URL to master.m3u8)
├─ rawVideoKey (R2 key in video-raw bucket)
├─ title
├─ description
├─ category (FK)
├─ tags (M:M ShortTag)
├─ location (geometry)
├─ ctaLink (URL)
├─ status (DRAFT | PENDING_PAYMENT | PROCESSING | PUBLISHED | ARCHIVED | DELETED)
├─ thumbnailUrl
├─ duration (seconds)
├─ publishedAt
├─ archivedAt
├─ stats (1:1 ShortStats)
└─ createdAt, updatedAt

ShortStats
├─ shortId (FK)
├─ views (counter)
├─ uniqueViews (counter)
├─ likes (counter)
├─ comments (counter)
├─ avgWatchTime (seconds)
└─ updatedAt

Category
├─ id
├─ name
├─ slug
├─ icon (URL)
├─ parentId (FK - self-referencing, nullable)
└─ order

Tag
├─ id
├─ name
├─ slug
└─ usageCount

Like
├─ userId (FK)
├─ shortId (FK)
├─ type (LIKE | DISLIKE | FIRE | HEART | LAUGH | WOW | CLAP)
└─ createdAt
└─ UNIQUE(userId, shortId)

Comment
├─ id (UUID)
├─ userId (FK)
├─ shortId (FK)
├─ parentId (FK - nullable)
├─ content (markdown)
├─ status (PENDING | APPROVED | REJECTED | DELETED)
├─ toxicityScore (float)
└─ createdAt, updatedAt

Follow
├─ userId (FK)
├─ companyId (FK)
└─ createdAt
└─ UNIQUE(userId, companyId)

Report
├─ id (UUID)
├─ reporterId (FK)
├─ shortId (FK - nullable)
├─ commentId (FK - nullable)
├─ reason (enum)
├─ description
├─ status (PENDING | REVIEWED | RESOLVED)
└─ createdAt, resolvedAt

Payment
├─ id (UUID)
├─ companyId (FK)
├─ shortId (FK)
├─ providerPaymentId
├─ amount (decimal)
├─ currency
├─ status (PENDING | SUCCEEDED | FAILED | REFUNDED)
├─ invoiceUrl (URL)
└─ createdAt, updatedAt

Notification
├─ id (UUID)
├─ userId (FK)
├─ type (enum)
├─ title
├─ message
├─ link (URL)
├─ read (boolean)
└─ createdAt

AuditLog
├─ id (UUID)
├─ adminId (FK)
├─ action (enum)
├─ targetType (USER | SHORT | COMMENT)
├─ targetId (UUID)
├─ metadata (JSON)
└─ createdAt
```

**Relacje:**
- User 1:N Short (through CompanyProfile)
- User 1:N Comment
- User M:N Short (likes)
- User M:N CompanyProfile (follows)
- Short 1:N Comment
- Short M:N Tag
- Category 1:N Category (self-referencing)
- Short 1:1 Payment
- Short 1:1 ShortStats

---

## 8. Integracje Zewnętrzne

### 8.1 Video Pipeline (Cloudflare R2 + Qencode)
- **Purpose:** Video upload, transcoding, storage, streaming
- **Components:**
  - **R2 video-raw bucket:** Private, 24h auto-delete, presigned PUT URLs
  - **R2 video-hls bucket:** Public CDN, HLS segments + playlists
  - **Qencode API:** Transcoding service
- **Endpoints:**
  - R2 presigned PUT URL generation (upload)
  - Qencode: POST job, GET status
  - Webhook: Qencode callback on completion
  - HLS Playback: Cloudflare CDN URLs
- **Transcoding Profile:**
  - HLS, 4-6s segments, H.264 High/Main
  - Resolutions: 1080p (4500kbps), 720p (2500kbps), 480p (1000kbps)
  - Aspect ratio: 9:16
- **Cache Headers:**
  - .ts/.jpg: max-age=31536000 (1 year)
  - .m3u8: max-age=3600 (1 hour)
- **SLA:** R2 99.9%, Qencode 99.5%
- **Failover:** Retry transcoding (max 3x), static thumbnail fallback

### 8.2 Payment Gateways (Przelewy24, Tpay)
- **Purpose:** Payment processing, invoicing
- **Providers:** Przelewy24 (primary), Tpay (secondary)
- **Endpoints:**
  - Checkout Session creation (per provider)
  - Webhooks: payment.succeeded, payment.failed (per provider)
  - Invoice generation
- **SLA:** 99.9% uptime (per provider)
- **Failover:** Payment retry logic, provider fallback, manual invoice generation

### 8.3 Mapbox (Geolocation)
- **Purpose:** Address autocomplete, geocoding, heatmaps
- **Endpoints:**
  - Geocoding API (address → coordinates)
  - Search API (autocomplete)
  - Static Maps API (thumbnails)
- **SLA:** 99.9% uptime
- **Failover:** Cached results, fallback do text-only address

### 8.4 VIES API (Company Verification)
- **Purpose:** VAT number validation (EU)
- **Endpoint:** checkVat (SOAP/REST)
- **SLA:** Best effort (EU public service)
- **Failover:** Manual verification przez admina

### 8.5 Perspective API (Moderation)
- **Purpose:** Toxicity scoring dla komentarzy
- **Endpoint:** analyzeComment
- **SLA:** 99% uptime
- **Failover:** Auto-approve jeśli API down + manual review

### 8.6 Resend (Email)
- **Purpose:** Transactional emails
- **SLA:** 99.9% uptime
- **Failover:** Retry queue (Inngest), fallback do in-app notifications

### 8.7 PostHog (Analytics)
- **Purpose:** Product analytics, feature flags
- **SLA:** 99.9% uptime
- **Failover:** Client-side failover, non-blocking

### 8.8 Cloudflare R2 (Storage + Video)
- **Purpose:** Image + video storage, CDN delivery
- **Buckets:**
  - **video-raw:** Private, raw uploads, 24h lifecycle auto-delete
  - **video-hls:** Public, transcoded HLS output, CDN enabled
  - **images:** Public, avatars, logos, banners, thumbnails
- **SLA:** 99.9% uptime
- **Failover:** Multi-region redundancy (Cloudflare auto)
- **CORS:** Configured for localhost:3000 and production domain

---

## 9. Ograniczenia i Założenia

### 9.1 Ograniczenia Biznesowe
- **CONSTR-BIZ-001:** Tylko rynek polski (MVP)
- **CONSTR-BIZ-002:** Tylko firmy zweryfikowane VIES mogą publikować
- **CONSTR-BIZ-003:** Single payment per short (no subscriptions w MVP)
- **CONSTR-BIZ-004:** Brak funkcji share (post-MVP)

### 9.2 Ograniczenia Techniczne
- **CONSTR-TECH-001:** Max 100MB upload (Vercel limit)
- **CONSTR-TECH-002:** Max 60 sekund video (business rule)
- **CONSTR-TECH-003:** Serverless functions timeout 10s (Vercel)
- **CONSTR-TECH-004:** Database: 10GB storage na start (Neon free tier limits)

### 9.3 Założenia
- **ASSUME-001:** Firmy mają NIP i są w systemie VIES
- **ASSUME-002:** Użytkownicy mają nowoczesne przeglądarki (HTML5 video)
- **ASSUME-003:** Średnio 10% firm publikuje więcej niż 1 short/miesiąc
- **ASSUME-004:** Średnia watch time > 50% video duration
- **ASSUME-005:** 80% ruchu z mobile

---

## 10. Ryzyka

### 10.1 Ryzyka Techniczne

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|----|--------|-------------------|-------|-----------|
| RISK-TECH-001 | R2/Qencode downtime powoduje brak video upload/playback | Niskie | Wysokie | Graceful degradation, cached content, status page |
| RISK-TECH-002 | Payment provider webhook delivery failures | Średnie | Wysokie | Idempotency keys, retry logic w Inngest, manual reconciliation |
| RISK-TECH-003 | VIES API unstable | Wysokie | Średnie | Fallback do manual verification, cache results |
| RISK-TECH-004 | Database scaling bottleneck | Niskie | Wysokie | Connection pooling, read replicas (Neon), query optimization |
| RISK-TECH-005 | Qencode transcode failures | Średnie | Średnie | Retry logic (max 3x), 24h raw retention, error notifications, refund flow |

### 10.2 Ryzyka Biznesowe

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|----|--------|-------------------|-------|-----------|
| RISK-BIZ-001 | Niskie adoption przez firmy | Średnie | Wysokie | Marketing campaign, free trial (3 shorty gratis), case studies |
| RISK-BIZ-002 | Spam/low-quality content | Wysokie | Wysokie | Perspective API, manual moderation, quality guidelines |
| RISK-BIZ-003 | Copyright infringement | Średnie | Wysokie | Report system, DMCA process, ToS enforcement |
| RISK-BIZ-004 | Seasonal traffic (niski engagement w wakacje) | Średnie | Średnie | Push notifications, email campaigns, company reminders |
| RISK-BIZ-005 | Konkurencja (TikTok, Instagram Reels) | Wysokie | Średnie | Focus na local + B2B niche, analytics jako USP |

### 10.3 Ryzyka Prawne

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|----|--------|-------------------|-------|-----------|
| RISK-LEGAL-001 | GDPR non-compliance | Niskie | Bardzo wysokie | Legal review, data retention policy, cookie consent, right to be forgotten |
| RISK-LEGAL-002 | VAT invoicing errors | Średnie | Średnie | Payment provider auto-validation, accounting software integration |
| RISK-LEGAL-003 | User-generated content liability | Średnie | Wysokie | ToS disclaimers, moderation SLA, DMCA process |

---

## 11. Architektura Etapowania (Stages)

Projekt zostanie podzielony na etapy przez **subagent_stage_planner**. Proponowany breakdown:

### Etap 1: Core + Auth (P0)
- Authentication (email + OAuth)
- User profiles
- Dark mode
- i18n setup
- Deployment pipeline

### Etap 2: Companies + Verification (P0)
- Company profiles
- VIES verification
- Category management
- Admin panel basics

### Etap 3: Shorts Upload + Payments (P0)
- Serverless Video Pipeline (R2 + Qencode)
- Direct upload do R2
- Qencode transcoding (HLS)
- Payment gateway checkout (Przelewy24, Tpay)
- Multi-provider payment webhooks
- Short metadata

### Etap 4: Feed + Discovery (P0)
- Feed infinite scroll
- Filtering (location, categories)
- Sorting
- Search (basic)

### Etap 5: Interactions (P1)
- Likes/reactions
- Comments
- Perspective API
- Follow system

### Etap 6: Moderation (P1)
- Report system
- Moderation queue
- Admin actions
- Audit log

### Etap 7: Analytics (P1)
- Company dashboard
- Short stats
- PostHog integration
- Video retention analytics (PostHog events)

### Etap 8: Notifications + Lifecycle (P1)
- Email notifications (Resend)
- In-app notifications
- Auto-archivization
- Renewal flow

---

## 12. Definicja Sukcesu (MVP)

MVP zostanie uznany za sukces, jeśli po 3 miesiącach od launch:

1. **Adoption:**
   - 100+ zweryfikowanych firm
   - 500+ opublikowanych shortsów
   - 5,000+ zarejestrowanych użytkowników

2. **Engagement:**
   - Średni czas sesji > 3 minuty
   - 20% weekly active users (WAU)
   - Średnio 50% watch time per short

3. **Quality:**
   - < 5% zgłoszonych shortsów
   - < 24h moderation response time
   - 0 critical security incidents

4. **Technical:**
   - 95% uptime
   - < 2s LCP na feed
   - 0 data loss incidents

5. **Business:**
   - 15% firm publikujących 2+ shorty
   - Pozytywny feedback (NPS > 30)

---

## Appendix A: Glosariusz

- **Short:** Krótki film promocyjny (max 60 sek)
- **Feed:** Strona główna z listą shortsów
- **Company:** Zweryfikowana firma mogąca publikować shorty
- **User:** Użytkownik przeglądający (nie firma)
- **VIES:** VAT Information Exchange System (EU)
- **NIP:** Numer Identyfikacji Podatkowej (PL)
- **Transcode:** Konwersja video do różnych rozdzielczości
- **HLS:** HTTP Live Streaming protocol
- **Toxicity score:** Wynik z Perspective API (0-1)
- **LCP:** Largest Contentful Paint (Core Web Vital)

---

**Zatwierdził:** [Placeholder - Product Owner]
**Data zatwierdzenia:** [Placeholder]
