# Etap 3: Shorts Upload + Payments

**Projekt:** VideoShorts
**Priorytet:** P0 (Critical - MVP Core)
**Zależności:** Etap 1 (Core + Auth), Etap 2 (Companies)
**Szacowany czas:** 3 tygodnie
**Status:** ⚪ Planowany

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

**Expiring notification (Email):**

```
Subject: Your short "[Title]" expires in 7 days

Your short will be archived on [Date].
Renew now to keep it active: [CTA Button]

Stats:
- Views: X
- Likes: Y
- Comments: Z
```

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

## 5. Wymagania Techniczne

### 5.1 Database Schema Changes

```prisma
enum ShortStatus {
  DRAFT
  PENDING_PAYMENT
  PROCESSING
  PUBLISHED
  ARCHIVED
  DELETED
}

enum PaymentProvider {
  PRZELEWY24
  TPAY
  OTHER
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum CreditSource {
  PACKAGE      // Pakiet zakupiony
  GIFT         // Otrzymany w prezencie
  PROMO        // Kod promocyjny
  REFUND       // Zwrot kredytów
  ADMIN        // Dodane przez admina
  OTHER        // Inne źródło
}

// Dodatkowe pole w User/CompanyProfile
model User {
  // ... existing fields
  publicationCredits Int @default(0) // Liczba dostępnych publikacji
  // ... rest of model
}

model CreditTransaction {
  id        String       @id @default(cuid())
  userId    String
  amount    Int          // Może być ujemny (-1 przy publikacji)
  source    CreditSource
  shortId   String?      // Jeśli związane z publikacją shorta
  paymentId String?      // Jeśli zakupione przez payment
  metadata  Json?        // Dodatkowe info (package name, promo code, etc.)
  createdAt DateTime     @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  short   Short?   @relation(fields: [shortId], references: [id])
  payment Payment? @relation(fields: [paymentId], references: [id])

  @@index([userId])
  @@index([source])
  @@index([createdAt])
}

model Short {
  id              String      @id @default(cuid())
  companyId       String
  qencodeTaskId   String?     @unique   // Qencode transcode task ID
  hlsPlaylistUrl  String?               // Master playlist URL (R2 public)
  rawVideoKey     String?               // R2 video-raw bucket key
  title           String
  description     String?     @db.Text
  categoryId      String
  latitude        Float?
  longitude       Float?
  address         String?
  ctaLink         String?
  status          ShortStatus @default(DRAFT)
  thumbnailUrl    String?
  duration        Int?        // seconds
  aspectRatio     String?     // "9:16", "16:9", etc.
  publishedAt     DateTime?
  archivedAt      DateTime?
  expiresAt       DateTime?   // publishedAt + 30 days
  processingError String?     @db.Text
  retryCount      Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  company  CompanyProfile @relation(fields: [companyId], references: [id], onDelete: Cascade)
  category Category       @relation(fields: [categoryId], references: [id])
  tags     ShortTag[]
  payment  Payment?
  stats    ShortStats?

  @@index([companyId])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@index([categoryId])
  @@index([qencodeTaskId])
}

model ShortStats {
  id            String   @id @default(cuid())
  shortId       String   @unique
  views         Int      @default(0)
  uniqueViews   Int      @default(0)
  likes         Int      @default(0)
  comments      Int      @default(0)
  ctaClicks     Int      @default(0)
  avgWatchTime  Float?   // seconds
  updatedAt     DateTime @updatedAt

  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)

  @@index([shortId])
}

model Tag {
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  usageCount Int        @default(0)
  createdAt  DateTime   @default(now())

  shorts ShortTag[]

  @@index([slug])
  @@index([usageCount])
}

model ShortTag {
  shortId String
  tagId   String

  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([shortId, tagId])
  @@index([shortId])
  @@index([tagId])
}

model Payment {
  id                  String          @id @default(cuid())
  userId              String
  shortId             String          @unique
  provider            PaymentProvider @default(PRZELEWY24)
  providerPaymentId   String          @unique
  providerSessionId   String?         @unique
  amount              Decimal         @db.Decimal(10, 2)
  currency            String          @default("PLN")
  status              PaymentStatus   @default(PENDING)
  invoiceUrl          String?
  metadata            Json?           // Provider-specific data + {renewal, previousPaymentId}
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([shortId])
  @@index([status])
  @@index([provider])
  @@index([providerPaymentId])
}
```

### 5.2 API Endpoints

**Shorts CRUD:**

```
POST   /api/shorts (create draft)
  Body: {title, description?, categoryId, tags[], latitude?, longitude?, address?, ctaLink?}
  Returns: {shortId}

GET    /api/shorts/:id
PATCH  /api/shorts/:id (metadata only: title, description, tags, ctaLink)
DELETE /api/shorts/:id (soft delete, draft only)
```

**Video Pipeline (R2 + Qencode):**

```
POST   /api/shorts/:id/upload-url
  Returns: {url: string, key: string}  // R2 presigned PUT URL

POST   /api/shorts/:id/trigger-transcode
  Triggers Qencode transcoding job after upload
  Returns: {qencodeTaskId: string}

GET    /api/shorts/:id/transcode-status
  Returns: {status: string, progress?: number}

POST   /api/webhooks/qencode
  Body: Qencode webhook payload
  Handles: job.completed, job.failed
```

**Publish & Payment:**

```
POST   /api/shorts/:id/publish
  Returns: {checkoutUrl: string}
  Creates Payment Gateway Checkout Session (provider selected)

POST   /api/shorts/:id/renew (for archived shorts)
  Returns: {checkoutUrl: string}
  Creates Payment Gateway Checkout Session
```

**Payment Webhooks:**

```
POST   /api/webhooks/przelewy24
  Body: Przelewy24 webhook payload
  Handles: payment.succeeded, payment.failed
  Signature verification (Przelewy24 webhook secret)

POST   /api/webhooks/tpay
  Body: Tpay webhook payload
  Handles: payment.succeeded, payment.failed
  Signature verification (Tpay webhook secret)
```

**Status Check:**

```
GET    /api/shorts/:id/status
  Returns: {status, progress?, eta?}
  Used for polling during processing
```

**Tags:**

```
GET    /api/tags (search, autocomplete)
  Query: ?q=food&limit=10
  Returns: [{id, name, slug, usageCount}]
```

### 5.3 Video Pipeline Clients

```typescript
// src/lib/video-pipeline/r2-upload.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function createUploadUrl(shortId: string) {
  const key = `uploads/${shortId}/${Date.now()}.mp4`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_VIDEO_RAW_BUCKET!,
    Key: key,
    ContentType: "video/mp4",
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return { url, key };
}

export async function deleteRawVideo(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_VIDEO_RAW_BUCKET!,
    Key: key,
  });
  await r2Client.send(command);
}
```

```typescript
// src/lib/video-pipeline/qencode.ts
const QENCODE_API_URL = "https://api.qencode.com/v1";

export interface TranscodeOptions {
  inputUrl: string;      // R2 presigned GET URL
  outputPath: string;    // R2 video-hls path
  callbackUrl: string;   // Webhook URL
}

export async function createTranscodeJob(options: TranscodeOptions) {
  const response = await fetch(`${QENCODE_API_URL}/create_task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.QENCODE_API_KEY}`,
    },
    body: JSON.stringify({
      query: {
        source: options.inputUrl,
        format: [{
          output: "advanced_hls",
          destination: {
            url: options.outputPath,
            key: process.env.R2_ACCESS_KEY_ID,
            secret: process.env.R2_SECRET_ACCESS_KEY,
          },
          segment_duration: 5,
          stream: [
            { size: "1080x1920", bitrate: 4500, profile: "high" },
            { size: "720x1280", bitrate: 2500, profile: "main" },
            { size: "480x854", bitrate: 1000, profile: "main" },
          ],
        }],
      },
      callback_url: options.callbackUrl,
    }),
  });

  const data = await response.json();
  return { taskId: data.task_token };
}

export async function getTaskStatus(taskId: string) {
  const response = await fetch(`${QENCODE_API_URL}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.QENCODE_API_KEY}`,
    },
    body: JSON.stringify({ task_tokens: [taskId] }),
  });

  const data = await response.json();
  return data.statuses[taskId];
}
```

### 5.4 Publication Controller

```typescript
// src/lib/publication/publication-controller.ts
export interface PublicationResult {
	success: boolean;
	needsPayment?: boolean;
	checkoutUrl?: string;
	error?: string;
}

export interface PublicationLimits {
	availableCredits: number;
	canPublish: boolean;
	reason?: string;
}

export class PublicationController {
	/**
	 * Sprawdza czy user może opublikować short
	 */
	async canPublish(userId: string): Promise<PublicationLimits> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { companyProfile: true },
		});

		if (!user) {
			return {
				availableCredits: 0,
				canPublish: false,
				reason: "User not found",
			};
		}

		if (!user.companyProfile?.viesVerified) {
			return {
				availableCredits: user.publicationCredits,
				canPublish: false,
				reason: "Company not verified",
			};
		}

		return {
			availableCredits: user.publicationCredits,
			canPublish: user.publicationCredits > 0,
			reason:
				user.publicationCredits === 0 ? "No credits available" : undefined,
		};
	}

	/**
	 * Publikuje short - używa kredytów lub wymaga płatności
	 */
	async publish(userId: string, shortId: string): Promise<PublicationResult> {
		const limits = await this.canPublish(userId);

		// Jeśli nie może publikować (brak weryfikacji)
		if (!limits.canPublish && limits.reason !== "No credits available") {
			return { success: false, error: limits.reason };
		}

		// Jeśli ma kredyty - użyj ich
		if (limits.availableCredits > 0) {
			await this.publishWithCredits(userId, shortId);
			return { success: true };
		}

		// Jeśli brak kredytów - redirect do płatności
		const checkoutUrl = await this.createCheckoutSession(userId, shortId);
		return { success: false, needsPayment: true, checkoutUrl };
	}

	/**
	 * Publikacja z użyciem kredytów
	 */
	private async publishWithCredits(
		userId: string,
		shortId: string
	): Promise<void> {
		await prisma.$transaction(async (tx) => {
			// 1. Zmniejsz kredyty
			await tx.user.update({
				where: { id: userId },
				data: { publicationCredits: { decrement: 1 } },
			});

			// 2. Zapisz transakcję (audit)
			await tx.creditTransaction.create({
				data: {
					userId,
					shortId,
					amount: -1,
					source: "PACKAGE", // lub inny source zależnie od kontekstu
				},
			});

			// 3. Zaktualizuj status shorta
			await tx.short.update({
				where: { id: shortId },
				data: { status: "PROCESSING" },
			});
		});

		// 4. Rozpocznij transkodowanie (Qencode webhook będzie później)
		// Video jest już w R2 video-raw bucket
	}

	/**
	 * Tworzy Payment Gateway Checkout Session dla zakupu kredytów
	 */
	private async createCheckoutSession(
		userId: string,
		shortId: string
	): Promise<string> {
		const provider = PaymentProviderFactory.getProvider();

		const session = await provider.createCheckoutSession({
			amount: 500, // 5 PLN (in grosze)
			currency: "PLN",
			description: "Video Short Publication - 30-day visibility",
			metadata: {
				userId,
				shortId,
				type: "single_publication",
			},
			successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shorts/${shortId}/publishing`,
			cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shorts/${shortId}`,
		});

		return session.checkoutUrl;
	}

	/**
	 * Zwraca informacje o limitach publikacji
	 */
	async getPublicationLimits(userId: string): Promise<PublicationLimits> {
		return this.canPublish(userId);
	}

	/**
	 * Dodaje kredyty po udanej płatności
	 */
	async addCreditsFromPayment(
		userId: string,
		amount: number,
		paymentId: string,
		source: CreditSource = "PACKAGE"
	): Promise<void> {
		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: { publicationCredits: { increment: amount } },
			});

			await tx.creditTransaction.create({
				data: {
					userId,
					paymentId,
					amount,
					source,
				},
			});
		});
	}
}

export const publicationController = new PublicationController();
```

### 5.5 Payment Provider Factory

```typescript
// src/lib/payment-providers/factory.ts
import { Przelewy24Provider } from "./przelewy24";
import { TpayProvider } from "./tpay";

export type PaymentProvider = "PRZELEWY24" | "TPAY";

export class PaymentProviderFactory {
	static getProvider(provider?: PaymentProvider) {
		const defaultProvider = process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProvider || "PRZELEWY24";
		const selectedProvider = provider || defaultProvider;

		switch (selectedProvider) {
			case "PRZELEWY24":
				return new Przelewy24Provider();
			case "TPAY":
				return new TpayProvider();
			default:
				return new Przelewy24Provider();
		}
	}
}
```

### 5.5 Background Jobs (Inngest)

```typescript
// Short lifecycle jobs

// 1. Payment succeeded → update short status
inngest.createFunction(
	{ name: "payment.succeeded" },
	{ event: "payment/payment.succeeded" },
	async ({ event }) => {
		const { shortId, paymentIntentId } = event.data;

		// Update payment
		await prisma.payment.update({
			where: { providerPaymentId: paymentIntentId },
			data: { status: "SUCCEEDED" },
		});

		// Update short
		await prisma.short.update({
			where: { id: shortId },
			data: { status: "PROCESSING" },
		});

		// Wait for Qencode webhook (handled separately)
	}
);

// 2. Qencode transcode complete → publish short
inngest.createFunction(
	{ name: "qencode.job.completed" },
	{ event: "qencode/job.completed" },
	async ({ event }) => {
		const { taskId, hlsUrl, duration, thumbnailUrl } = event.data;

		const short = await prisma.short.findUnique({
			where: { qencodeTaskId: taskId },
			include: { company: true },
		});

		if (!short) return;

		// Update short with HLS playlist URL
		await prisma.short.update({
			where: { id: short.id },
			data: {
				status: "PUBLISHED",
				hlsPlaylistUrl: hlsUrl,
				thumbnailUrl,
				duration,
				publishedAt: new Date(),
				expiresAt: addDays(new Date(), 30),
			},
		});

		// Cleanup: delete raw video from video-raw bucket
		if (short.rawVideoKey) {
			await deleteRawVideo(short.rawVideoKey);
		}

		// Send notification email
		await sendEmail({
			to: short.company.email,
			template: "ShortPublished",
			data: { shortId: short.id, title: short.title },
		});
	}
);

// 2b. Qencode transcode failed → retry or refund
inngest.createFunction(
	{ name: "qencode.job.failed" },
	{ event: "qencode/job.failed" },
	async ({ event }) => {
		const { taskId, error } = event.data;

		const short = await prisma.short.findUnique({
			where: { qencodeTaskId: taskId },
			include: { company: true },
		});

		if (!short) return;

		if (short.retryCount < 3) {
			// Retry transcoding
			await prisma.short.update({
				where: { id: short.id },
				data: { retryCount: { increment: 1 } },
			});
			// Re-trigger Qencode job
			await inngest.send({ name: "qencode/retry.transcode", data: { shortId: short.id } });
		} else {
			// Max retries reached - refund credits and notify
			await prisma.short.update({
				where: { id: short.id },
				data: { status: "DRAFT", processingError: error },
			});
			// Refund credit
			await publicationController.refundCredit(short.company.userId, short.id);
			// Send error email
			await sendEmail({
				to: short.company.email,
				template: "ShortProcessingFailed",
				data: { shortId: short.id, title: short.title, error },
			});
		}
	}
);

// 3. Daily cron: expiring reminders (7 days before)
inngest.createFunction(
	{ name: "shorts.expiring.reminders" },
	{ cron: "0 9 * * *" }, // 9 AM daily
	async () => {
		const expiringShorts = await prisma.short.findMany({
			where: {
				status: "PUBLISHED",
				expiresAt: {
					gte: new Date(),
					lte: addDays(new Date(), 7),
				},
			},
			include: { company: true, stats: true },
		});

		for (const short of expiringShorts) {
			await inngest.send({
				name: "short.expiring.reminder",
				data: { shortId: short.id },
			});
		}
	}
);

// 4. Daily cron: auto-archive expired shorts
inngest.createFunction(
	{ name: "shorts.archive.expired" },
	{ cron: "0 3 * * *" }, // 3 AM daily
	async () => {
		const expiredShorts = await prisma.short.findMany({
			where: {
				status: "PUBLISHED",
				expiresAt: { lte: new Date() },
			},
		});

		for (const short of expiredShorts) {
			await prisma.short.update({
				where: { id: short.id },
				data: {
					status: "ARCHIVED",
					archivedAt: new Date(),
				},
			});
		}
	}
);
```

### 5.6 UI Components

**New components:**

- ShortUploadWizard (multi-step form)
- VideoUploader (drag & drop, progress bar, R2 direct upload)
- VidstackPlayer (@vidstack/react HLS player)
- ThumbnailPicker (grid z options)
- TagAutocomplete (async search)
- PaymentStatus (timeline visualization)
- ShortsTable (dashboard list z filters)

**VidstackPlayer Example:**

```tsx
// src/components/video/vidstack-player.tsx
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VidstackPlayerProps {
  src: string;           // HLS master playlist URL
  poster?: string;       // Thumbnail URL
  autoPlay?: boolean;
}

export function VidstackPlayer({ src, poster, autoPlay = false }: VidstackPlayerProps) {
  return (
    <MediaPlayer
      src={src}
      viewType="video"
      streamType="on-demand"
      aspectRatio="9/16"
      autoPlay={autoPlay}
      playsInline
    >
      <MediaProvider>
        {poster && <Poster src={poster} alt="Video thumbnail" />}
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
```

### 5.7 Pages & Routes

```
/dashboard/shorts                    # Shorts list (company)
/dashboard/shorts/create             # Upload wizard
/dashboard/shorts/:id                # Short detail (edit, stats)
/dashboard/shorts/:id/publishing     # Processing status page
/shorts/:id                          # Public short view
```

---

## 6. Kryteria Akceptacji (Etap jako całość)

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

### Integracje:

- [ ] R2 Direct Upload działa (presigned PUT URL)
- [ ] Qencode transcode webhooks handled (job.completed, job.failed)
- [ ] Payment Gateway Checkout działa (Przelewy24, Tpay)
- [ ] Payment webhooks handled (obu providerów)
- [ ] Invoice auto-generation
- [ ] Email notifications (Resend)
- [ ] @vidstack/react HLS player działa

---

## 7. Out of Scope (Nie w tym etapie)

- ❌ Feed z shortsami (Etap 4)
- ❌ Search i filtry (Etap 4)
- ❌ Likes, comments (Etap 5)
- ❌ Analytics dashboard (Etap 7)
- ❌ Moderation (Etap 6)
- ❌ Shares (Post-MVP)
- ❌ Multiple videos per checkout (Post-MVP)
- ❌ Subscription model (Post-MVP)

---

## 8. Zależności

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

## 9. Ryzyka i Mitygacje

### Ryzyko 1: Qencode Transcode Failures

**Prawdopodobieństwo:** Średnie (5-10% failure rate)
**Wpływ:** Wysoki
**Mitygacja:**

- Retry logic (max 3 attempts, exponential backoff)
- Email notification do firmy jeśli fail
- Admin dashboard: failed transcodes queue
- Automatic refund credits jeśli 3 retries fail
- Clear error messaging: "Video format invalid" vs "Service error"
- Qencode status polling dla real-time updates

### Ryzyko 2: Payment Provider Webhook Delivery Failures

**Prawdopodobieństwo:** Niskie
**Wpływ:** Krytyczny
**Mitygacja:**

- Idempotency keys (safe replay per provider)
- Inngest retry mechanism (automatic)
- Manual reconciliation tool w admin (compare Provider vs DB)
- Monitoring: alert on high webhook failure rate
- Provider-specific testing tools dla local development

### Ryzyko 3: Processing Time > Expected

**Prawdopodobieństwo:** Średnie
**Wpływ:** Średni (user frustration)
**Mitygacja:**

- Clear messaging: "Processing usually takes 2-5 minutes"
- Email notification gdy ready (user może close tab)
- Real-time status updates (polling lub SSE)
- Timeout: 15 min → auto-fail + retry

### Ryzyko 4: R2 Storage / Qencode Costs

**Prawdopodobieństwo:** Niskie (w MVP)
**Wpływ:** Średni (business cost)
**Mitygacja:**

- Monitor R2 storage usage (Cloudflare dashboard)
- Monitor Qencode transcoding minutes
- Set alerts: > 1000 transcodes/day
- Rate limiting: 10 uploads/hour per company
- Auto-cleanup: delete raw video after successful transcode
- R2 video-raw bucket: 24h lifecycle rule for failed uploads

### Ryzyko 5: VAT Invoicing Errors

**Prawdopodobieństwo:** Niskie (Payment provider auto)
**Wpływ:** Średni (legal compliance)
**Mitygacja:**

- Payment provider tax configured correctly (PL: 23% VAT)
- Manual review sample invoices przed launch
- Accounting software integration (post-MVP)
- Admin can regenerate invoices jeśli error

---

## 10. Metryki Sukcesu (Ten Etap)

### Technical Metrics:

- Upload success rate > 90%
- Transcode success rate > 95%
- Payment success rate > 85% (industry standard)
- Invoice generation success rate > 99%
- Processing time p95 < 5 min

### Business Metrics (Post-Launch):

- Shorts published per day: > 10 (MVP goal)
- Conversion: draft → published > 70%
- Renewal rate: > 20% (z archived shorts)
- Average revenue per company: > 50 PLN/month (10 shorts)

---

## 11. Harmonogram (Przykładowy)

### Tydzień 1: Upload + Video Pipeline Integration

- **Dni 1-2:** Database schema, R2 upload client, presigned URLs
- **Dni 3-4:** Upload wizard (video upload, metadata form), Qencode integration
- **Dzień 5:** Thumbnail picker, draft save/load

### Tydzień 2: Payments + Webhooks

- **Dni 1-2:** Przelewy24/Tpay integration, checkout flow
- **Dni 3-4:** Webhook handlers (Przelewy24, Tpay, Qencode), Inngest jobs
- **Dzień 5:** Payment status page, processing timeline

### Tydzień 3: Public View + Lifecycle

- **Dni 1-2:** Public short page, @vidstack/react player
- **Dni 3:** Dashboard shorts management (list, edit, archive)
- **Dni 4:** Lifecycle cron jobs (expiring, archive), renewal flow
- **Dzień 5:** Testing, edge cases, documentation

---

## 12. Historia Zmian

| Data       | Wersja | Autor            | Zmiany                |
| ---------- | ------ | ---------------- | --------------------- |
| 2025-11-28 | 1.0    | AI Stage Planner | Initial specification |
| 2025-12-30 | 2.0    | AI Project Modifier | Migration: Mux → Serverless Video Pipeline (R2 + Qencode + Vidstack) |

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
**Status:** ✅ Ready for Export to AI Spec Flow
