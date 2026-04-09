# Architecture: Stage 03 - Shorts Upload + Payments

**Project:** videoshorts-stage-03-shorts-payments
**Date:** 2025-12-31
**Iteration:** v1

---

## 1. Database Schema Design

### 1.1 Migration: Mux to Qencode Field Renaming

The existing `Short` model has fields named for Mux that need renaming to Qencode. This is a **non-destructive migration** using `@map` to preserve existing data.

```prisma
// Migration strategy: Use @map to rename at DB level while updating code-level names
// File: prisma/schema.prisma

model Short {
  id              String      @id @default(cuid())
  companyId       String

  // RENAMED: Mux -> Qencode (use @map for DB column preservation)
  qencodeTaskId   String?     @unique @map("muxAssetId")    // Was: muxAssetId
  hlsPlaylistUrl  String?     @unique @map("muxPlaybackId") // Was: muxPlaybackId
  rawVideoKey     String?     @map("muxUploadId")           // Was: muxUploadId

  title           String      @db.VarChar(100)
  description     String?     @db.Text
  categoryId      String
  latitude        Float?
  longitude       Float?
  address         String?
  ctaLink         String?
  status          ShortStatus @default(DRAFT)
  thumbnailUrl    String?
  customThumbnail Boolean     @default(false)
  duration        Int?
  aspectRatio     String?
  publishedAt     DateTime?   @db.Timestamptz(6)
  archivedAt      DateTime?   @db.Timestamptz(6)
  expiresAt       DateTime?   @db.Timestamptz(6)
  processingError String?     @db.Text
  retryCount      Int         @default(0)
  createdAt       DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime    @updatedAt @db.Timestamptz(6)

  company            CompanyProfile      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  category           Category            @relation(fields: [categoryId], references: [id])
  tags               ShortTag[]
  payment            Payment?
  stats              ShortStats?
  creditTransactions CreditTransaction[]

  @@index([companyId])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@index([categoryId])
  @@index([qencodeTaskId])
}
```

### 1.2 Complete Models (Already Exist - No Changes Needed)

The following models are already properly defined in `prisma/schema.prisma`:

- **Short** - Core entity (needs field rename only)
- **ShortStats** - View/like/comment statistics
- **Tag** - Tag entity with usage count
- **ShortTag** - Junction table for many-to-many
- **Payment** - Multi-provider payment records
- **CreditTransaction** - Audit trail for credits
- **User.publicationCredits** - Credit balance field

### 1.3 Enums (Already Exist - No Changes Needed)

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
  PACKAGE
  GIFT
  PROMO
  REFUND
  ADMIN
  PUBLICATION
  OTHER
}
```

### 1.4 Migration Steps

```bash
# Step 1: Create migration for field rename (additive, non-destructive)
npx prisma migrate dev --name rename_mux_to_qencode_fields

# Migration SQL will be:
# ALTER TABLE "Short" RENAME COLUMN "muxAssetId" TO "qencodeTaskId";
# ALTER TABLE "Short" RENAME COLUMN "muxPlaybackId" TO "hlsPlaylistUrl";
# ALTER TABLE "Short" RENAME COLUMN "muxUploadId" TO "rawVideoKey";
# (Or use @map to avoid actual column rename - safer approach)
```

---

## 2. Frontend Architecture

### 2.1 Navigation Updates

**File:** `src/components/layout/app-sidebar.tsx`

**Location to modify:** Lines 29-31 (after `const companyItems`)

**EXACT Code Change:**

```typescript
// src/components/layout/app-sidebar.tsx
// ADD imports at line 5:
import {
	Home,
	User,
	Settings,
	LogOut,
	Building2,
	Shield,
	Video,
	CreditCard,
} from "lucide-react";

// REPLACE companyItems array (lines 29-31) with:
// Company items (show only if COMPANY role)
const companyItems =
	userRole === "COMPANY"
		? [
				{
					href: `/${locale}/panel/company/profile`,
					icon: Building2,
					label: t("company.profile"),
				},
				{
					href: `/${locale}/panel/shorts`,
					icon: Video,
					label: t("company.shorts"),
				},
				{
					href: `/${locale}/panel/credits`,
					icon: CreditCard,
					label: t("company.credits"),
				},
			]
		: [];
```

**Sidebar Translation Keys to Add:**

```json
// In sidebar.json - add to "company" object:
"company": {
  "profile": "Company Profile",  // existing
  "shorts": "My Shorts",         // NEW
  "credits": "Credits"           // NEW
}
```

### 2.2 Routing Design

**New Page Files to Create:**

| Route                                    | File Path                                                       | Type   | Purpose                 |
| ---------------------------------------- | --------------------------------------------------------------- | ------ | ----------------------- |
| `/[locale]/panel/shorts`                 | `src/app/(main)/[locale]/panel/shorts/page.tsx`                 | Server | Shorts list (dashboard) |
| `/[locale]/panel/shorts/new`             | `src/app/(main)/[locale]/panel/shorts/new/page.tsx`             | Client | Upload wizard           |
| `/[locale]/panel/shorts/[id]`            | `src/app/(main)/[locale]/panel/shorts/[id]/page.tsx`            | Server | Short detail/edit       |
| `/[locale]/panel/shorts/[id]/publishing` | `src/app/(main)/[locale]/panel/shorts/[id]/publishing/page.tsx` | Client | Processing status       |
| `/[locale]/panel/credits`                | `src/app/(main)/[locale]/panel/credits/page.tsx`                | Server | Credits management      |
| `/[locale]/shorts/[id]`                  | `src/app/(main)/[locale]/shorts/[id]/page.tsx`                  | Server | Public short view       |

**File Structure:**

```
src/app/
├── (main)/[locale]/
│   ├── panel/
│   │   ├── shorts/
│   │   │   ├── page.tsx              # Shorts list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Upload wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Short detail
│   │   │       └── publishing/
│   │   │           └── page.tsx      # Processing status
│   │   └── credits/
│   │       └── page.tsx              # Credits management
│   └── shorts/
│       └── [id]/
│           └── page.tsx              # Public view
```

### 2.3 Translation Keys

**IMPORTANT:** Must update root `i18n.ts` after creating these files.

#### shorts.json (All 6 Locales)

**File:** `src/lib/locales/{de,en,es,pl,ru,uk}/shorts.json`

```json
{
	"meta": {
		"title": "My Shorts",
		"description": "Manage your video shorts"
	},
	"list": {
		"title": "My Shorts",
		"empty": "You haven't created any shorts yet",
		"emptyDescription": "Create your first short to reach customers",
		"createFirst": "Create Your First Short"
	},
	"create": {
		"title": "Create New Short",
		"steps": {
			"video": "Video",
			"metadata": "Details",
			"thumbnail": "Thumbnail",
			"review": "Review"
		}
	},
	"wizard": {
		"video": {
			"title": "Upload Video",
			"description": "Drag and drop your video or click to browse",
			"requirements": "MP4, MOV or WebM. Max 60 seconds, max 100MB.",
			"aspectRatioWarning": "Video is not in 9:16 format. It may not display optimally.",
			"uploading": "Uploading...",
			"uploadComplete": "Upload complete",
			"uploadFailed": "Upload failed",
			"invalidFormat": "Invalid file format. Use MP4, MOV or WebM.",
			"fileTooLarge": "File is too large. Maximum size is 100MB.",
			"durationTooLong": "Video is too long. Maximum duration is 60 seconds."
		},
		"metadata": {
			"title": "Short Details",
			"titleField": "Title",
			"titlePlaceholder": "Enter a catchy title",
			"titleHint": "Maximum 100 characters",
			"description": "Description",
			"descriptionPlaceholder": "Describe your short...",
			"descriptionHint": "Maximum 500 characters (optional)",
			"category": "Category",
			"categoryPlaceholder": "Select a category",
			"tags": "Tags",
			"tagsPlaceholder": "Add up to 10 tags",
			"tagsHint": "Press Enter to add a tag",
			"location": "Location",
			"locationPlaceholder": "Search for a location",
			"locationHint": "Defaults to your company location",
			"ctaLink": "Call to Action Link",
			"ctaLinkPlaceholder": "https://example.com/your-offer",
			"ctaLinkHint": "Optional link displayed with your short"
		},
		"thumbnail": {
			"title": "Thumbnail",
			"description": "Choose a thumbnail for your short",
			"auto": "Auto-generated",
			"autoDescription": "We'll extract a frame from your video",
			"custom": "Custom Upload",
			"customDescription": "Upload your own image (1080x1920, max 2MB)",
			"requirements": "JPEG or PNG. 9:16 aspect ratio recommended."
		},
		"review": {
			"title": "Review Your Short",
			"description": "Check everything before saving",
			"videoPreview": "Video Preview",
			"details": "Details",
			"thumbnailPreview": "Thumbnail Preview",
			"edit": "Edit"
		},
		"actions": {
			"next": "Next",
			"back": "Back",
			"saveDraft": "Save as Draft",
			"saving": "Saving...",
			"cancel": "Cancel"
		}
	},
	"detail": {
		"status": "Status",
		"createdAt": "Created",
		"publishedAt": "Published",
		"expiresAt": "Expires",
		"views": "Views",
		"likes": "Likes",
		"duration": "Duration",
		"category": "Category",
		"tags": "Tags",
		"location": "Location",
		"ctaLink": "CTA Link"
	},
	"status": {
		"DRAFT": "Draft",
		"PENDING_PAYMENT": "Pending Payment",
		"PROCESSING": "Processing",
		"PUBLISHED": "Published",
		"ARCHIVED": "Archived",
		"DELETED": "Deleted"
	},
	"actions": {
		"view": "View",
		"edit": "Edit",
		"publish": "Publish",
		"archive": "Archive",
		"duplicate": "Duplicate",
		"delete": "Delete",
		"renew": "Renew"
	},
	"publish": {
		"title": "Publish Short",
		"description": "Your short will be visible for 30 days",
		"cost": "Publication cost",
		"credits": "Your credits",
		"useCredits": "Use Credits",
		"payNow": "Pay {price} PLN",
		"noCredits": "You don't have any credits. Purchase below or pay per short.",
		"processing": "Publishing..."
	},
	"publishing": {
		"title": "Publishing Your Short",
		"description": "Please wait while we process your video",
		"steps": {
			"draft": "Draft created",
			"payment": "Payment received",
			"processing": "Processing video...",
			"publishing": "Publishing soon"
		},
		"estimatedTime": "Usually takes 2-5 minutes",
		"success": "Your short is live!",
		"viewShort": "View Short",
		"error": "Processing failed",
		"retry": "Retry",
		"refund": "Request Refund"
	},
	"archive": {
		"title": "Archive Short",
		"description": "This short will be removed from the feed but remain accessible via direct link.",
		"confirm": "Yes, Archive"
	},
	"delete": {
		"title": "Delete Draft",
		"description": "This action cannot be undone. The draft will be permanently deleted.",
		"confirm": "Yes, Delete"
	},
	"renew": {
		"title": "Renew Short",
		"description": "Extend visibility for another 30 days",
		"cost": "Renewal cost",
		"renewNow": "Renew for {price} PLN"
	},
	"public": {
		"company": "By",
		"viewProfile": "View Profile",
		"visitWebsite": "Visit Website",
		"share": "Share",
		"report": "Report"
	},
	"table": {
		"thumbnail": "Thumbnail",
		"title": "Title",
		"status": "Status",
		"views": "Views",
		"created": "Created",
		"expires": "Expires",
		"actions": "Actions"
	},
	"filters": {
		"all": "All",
		"drafts": "Drafts",
		"published": "Published",
		"archived": "Archived",
		"search": "Search shorts..."
	},
	"errors": {
		"notFound": "Short not found",
		"unauthorized": "You don't have access to this short",
		"maxDrafts": "Maximum number of drafts reached (10)",
		"uploadFailed": "Failed to upload video",
		"createFailed": "Failed to create short",
		"updateFailed": "Failed to update short",
		"deleteFailed": "Failed to delete short",
		"publishFailed": "Failed to publish short",
		"notVerified": "Your company must be verified to publish shorts",
		"insufficientCredits": "Insufficient credits"
	},
	"success": {
		"created": "Draft saved successfully",
		"updated": "Short updated successfully",
		"deleted": "Short deleted successfully",
		"archived": "Short archived successfully",
		"published": "Short published successfully",
		"renewed": "Short renewed successfully"
	}
}
```

**Polish Translation:** `src/lib/locales/pl/shorts.json`

```json
{
	"meta": {
		"title": "Moje Shortsy",
		"description": "Zarzadzaj swoimi video shortsami"
	},
	"list": {
		"title": "Moje Shortsy",
		"empty": "Nie masz jeszcze zadnych shortsow",
		"emptyDescription": "Stworz swoj pierwszy short i dotrzej do klientow",
		"createFirst": "Stworz Pierwszy Short"
	},
	"create": {
		"title": "Nowy Short",
		"steps": {
			"video": "Video",
			"metadata": "Szczegoly",
			"thumbnail": "Miniatura",
			"review": "Podsumowanie"
		}
	},
	"wizard": {
		"video": {
			"title": "Przeslij Video",
			"description": "Przeciagnij i upusc video lub kliknij aby wybrac",
			"requirements": "MP4, MOV lub WebM. Max 60 sekund, max 100MB.",
			"aspectRatioWarning": "Video nie jest w formacie 9:16. Moze nie wyswietlac sie optymalnie.",
			"uploading": "Przesylanie...",
			"uploadComplete": "Przeslano",
			"uploadFailed": "Przesylanie nie powiodlo sie",
			"invalidFormat": "Nieprawidlowy format. Uzyj MP4, MOV lub WebM.",
			"fileTooLarge": "Plik jest za duzy. Maksymalny rozmiar to 100MB.",
			"durationTooLong": "Video jest za dlugie. Maksymalny czas to 60 sekund."
		},
		"metadata": {
			"title": "Szczegoly Shorta",
			"titleField": "Tytul",
			"titlePlaceholder": "Wpisz chwytliwy tytul",
			"titleHint": "Maksymalnie 100 znakow",
			"description": "Opis",
			"descriptionPlaceholder": "Opisz swoj short...",
			"descriptionHint": "Maksymalnie 500 znakow (opcjonalnie)",
			"category": "Kategoria",
			"categoryPlaceholder": "Wybierz kategorie",
			"tags": "Tagi",
			"tagsPlaceholder": "Dodaj do 10 tagow",
			"tagsHint": "Wcisnij Enter aby dodac tag",
			"location": "Lokalizacja",
			"locationPlaceholder": "Wyszukaj lokalizacje",
			"locationHint": "Domyslnie lokalizacja Twojej firmy",
			"ctaLink": "Link CTA",
			"ctaLinkPlaceholder": "https://przyklad.pl/twoja-oferta",
			"ctaLinkHint": "Opcjonalny link wyswietlany przy shorcie"
		},
		"thumbnail": {
			"title": "Miniatura",
			"description": "Wybierz miniature dla swojego shorta",
			"auto": "Automatyczna",
			"autoDescription": "Wybierzemy klatke z Twojego video",
			"custom": "Wlasna",
			"customDescription": "Przeslij wlasny obrazek (1080x1920, max 2MB)",
			"requirements": "JPEG lub PNG. Zalecany format 9:16."
		},
		"review": {
			"title": "Sprawdz Shorta",
			"description": "Sprawdz wszystko przed zapisaniem",
			"videoPreview": "Podglad Video",
			"details": "Szczegoly",
			"thumbnailPreview": "Podglad Miniatury",
			"edit": "Edytuj"
		},
		"actions": {
			"next": "Dalej",
			"back": "Wstecz",
			"saveDraft": "Zapisz jako Szkic",
			"saving": "Zapisywanie...",
			"cancel": "Anuluj"
		}
	},
	"detail": {
		"status": "Status",
		"createdAt": "Utworzono",
		"publishedAt": "Opublikowano",
		"expiresAt": "Wygasa",
		"views": "Wyswietlenia",
		"likes": "Polubienia",
		"duration": "Czas trwania",
		"category": "Kategoria",
		"tags": "Tagi",
		"location": "Lokalizacja",
		"ctaLink": "Link CTA"
	},
	"status": {
		"DRAFT": "Szkic",
		"PENDING_PAYMENT": "Oczekuje na platnosc",
		"PROCESSING": "Przetwarzanie",
		"PUBLISHED": "Opublikowany",
		"ARCHIVED": "Zarchiwizowany",
		"DELETED": "Usuniety"
	},
	"actions": {
		"view": "Zobacz",
		"edit": "Edytuj",
		"publish": "Opublikuj",
		"archive": "Archiwizuj",
		"duplicate": "Duplikuj",
		"delete": "Usun",
		"renew": "Odnow"
	},
	"publish": {
		"title": "Opublikuj Shorta",
		"description": "Twoj short bedzie widoczny przez 30 dni",
		"cost": "Koszt publikacji",
		"credits": "Twoje kredyty",
		"useCredits": "Uzyj Kredytow",
		"payNow": "Zaplac {price} PLN",
		"noCredits": "Nie masz kredytow. Kup ponizej lub zaplac za pojedynczy short.",
		"processing": "Publikowanie..."
	},
	"publishing": {
		"title": "Publikowanie Shorta",
		"description": "Prosze czekac podczas przetwarzania video",
		"steps": {
			"draft": "Szkic utworzony",
			"payment": "Platnosc otrzymana",
			"processing": "Przetwarzanie video...",
			"publishing": "Wkrotce publikacja"
		},
		"estimatedTime": "Zwykle zajmuje 2-5 minut",
		"success": "Twoj short jest juz dostepny!",
		"viewShort": "Zobacz Shorta",
		"error": "Przetwarzanie nie powiodlo sie",
		"retry": "Ponow",
		"refund": "Poprosc o zwrot"
	},
	"archive": {
		"title": "Archiwizuj Shorta",
		"description": "Ten short zostanie usuniety z feedu ale bedzie dostepny przez bezposredni link.",
		"confirm": "Tak, Archiwizuj"
	},
	"delete": {
		"title": "Usun Szkic",
		"description": "Ta akcja nie moze byc cofnieta. Szkic zostanie trwale usuniety.",
		"confirm": "Tak, Usun"
	},
	"renew": {
		"title": "Odnow Shorta",
		"description": "Przedluz widocznosc o kolejne 30 dni",
		"cost": "Koszt odnowienia",
		"renewNow": "Odnow za {price} PLN"
	},
	"public": {
		"company": "Od",
		"viewProfile": "Zobacz Profil",
		"visitWebsite": "Odwiedz Strone",
		"share": "Udostepnij",
		"report": "Zglos"
	},
	"table": {
		"thumbnail": "Miniatura",
		"title": "Tytul",
		"status": "Status",
		"views": "Wyswietlenia",
		"created": "Utworzono",
		"expires": "Wygasa",
		"actions": "Akcje"
	},
	"filters": {
		"all": "Wszystkie",
		"drafts": "Szkice",
		"published": "Opublikowane",
		"archived": "Zarchiwizowane",
		"search": "Szukaj shortsow..."
	},
	"errors": {
		"notFound": "Short nie znaleziony",
		"unauthorized": "Nie masz dostepu do tego shorta",
		"maxDrafts": "Osiagnieto maksymalna liczbe szkicow (10)",
		"uploadFailed": "Nie udalo sie przeslac video",
		"createFailed": "Nie udalo sie utworzyc shorta",
		"updateFailed": "Nie udalo sie zaktualizowac shorta",
		"deleteFailed": "Nie udalo sie usunac shorta",
		"publishFailed": "Nie udalo sie opublikowac shorta",
		"notVerified": "Twoja firma musi byc zweryfikowana aby publikowac shortsy",
		"insufficientCredits": "Niewystarczajaca liczba kredytow"
	},
	"success": {
		"created": "Szkic zapisany pomyslnie",
		"updated": "Short zaktualizowany pomyslnie",
		"deleted": "Short usuniety pomyslnie",
		"archived": "Short zarchiwizowany pomyslnie",
		"published": "Short opublikowany pomyslnie",
		"renewed": "Short odnowiony pomyslnie"
	}
}
```

#### payments.json (All 6 Locales)

**File:** `src/lib/locales/{de,en,es,pl,ru,uk}/payments.json`

```json
{
	"meta": {
		"title": "Payments",
		"description": "Manage your payments and credits"
	},
	"credits": {
		"title": "Publication Credits",
		"balance": "Your Balance",
		"creditsAvailable": "{count} credits available",
		"history": "Transaction History",
		"noHistory": "No transactions yet",
		"purchase": "Purchase Credits",
		"packages": {
			"title": "Credit Packages",
			"single": "Single Publication",
			"singleDescription": "1 credit for one short",
			"starter": "Starter Pack",
			"starterDescription": "5 credits - save 10%",
			"business": "Business Pack",
			"businessDescription": "20 credits - save 20%",
			"enterprise": "Enterprise Pack",
			"enterpriseDescription": "50 credits - save 30%"
		}
	},
	"checkout": {
		"title": "Complete Payment",
		"summary": "Order Summary",
		"item": "Publication Credit",
		"items": "Publication Credits",
		"subtotal": "Subtotal",
		"vat": "VAT (23%)",
		"total": "Total",
		"payWith": "Pay with",
		"processing": "Processing payment...",
		"redirect": "Redirecting to payment provider..."
	},
	"providers": {
		"przelewy24": "Przelewy24",
		"przelewy24Description": "BLIK, bank transfer, cards, Google Pay",
		"tpay": "Tpay",
		"tpayDescription": "BLIK, bank transfer, cards, Apple Pay"
	},
	"methods": {
		"blik": "BLIK",
		"bankTransfer": "Bank Transfer",
		"card": "Credit/Debit Card",
		"googlePay": "Google Pay",
		"applePay": "Apple Pay"
	},
	"status": {
		"PENDING": "Pending",
		"SUCCEEDED": "Completed",
		"FAILED": "Failed",
		"REFUNDED": "Refunded"
	},
	"source": {
		"PACKAGE": "Package Purchase",
		"GIFT": "Gift",
		"PROMO": "Promotional",
		"REFUND": "Refund",
		"ADMIN": "Admin Grant",
		"PUBLICATION": "Publication",
		"OTHER": "Other"
	},
	"transaction": {
		"date": "Date",
		"type": "Type",
		"amount": "Amount",
		"balance": "Balance After",
		"shortLink": "Related Short"
	},
	"success": {
		"title": "Payment Successful!",
		"description": "Your credits have been added to your account.",
		"creditsAdded": "{count} credits added",
		"viewCredits": "View Credits",
		"continueShopping": "Create a Short"
	},
	"cancel": {
		"title": "Payment Cancelled",
		"description": "Your payment was not completed.",
		"tryAgain": "Try Again",
		"backToShorts": "Back to Shorts"
	},
	"errors": {
		"paymentFailed": "Payment failed. Please try again.",
		"invalidAmount": "Invalid payment amount",
		"providerError": "Payment provider error. Please try another method.",
		"sessionExpired": "Payment session expired. Please start again."
	},
	"invoice": {
		"title": "Invoice",
		"download": "Download Invoice",
		"generating": "Generating invoice..."
	}
}
```

**Polish Translation:** `src/lib/locales/pl/payments.json`

```json
{
	"meta": {
		"title": "Platnosci",
		"description": "Zarzadzaj platnosciami i kredytami"
	},
	"credits": {
		"title": "Kredyty Publikacji",
		"balance": "Twoje Saldo",
		"creditsAvailable": "{count} kredytow dostepnych",
		"history": "Historia Transakcji",
		"noHistory": "Brak transakcji",
		"purchase": "Kup Kredyty",
		"packages": {
			"title": "Pakiety Kredytow",
			"single": "Pojedyncza Publikacja",
			"singleDescription": "1 kredyt na jednego shorta",
			"starter": "Pakiet Startowy",
			"starterDescription": "5 kredytow - oszczedzasz 10%",
			"business": "Pakiet Biznesowy",
			"businessDescription": "20 kredytow - oszczedzasz 20%",
			"enterprise": "Pakiet Enterprise",
			"enterpriseDescription": "50 kredytow - oszczedzasz 30%"
		}
	},
	"checkout": {
		"title": "Dokoncz Platnosc",
		"summary": "Podsumowanie Zamowienia",
		"item": "Kredyt Publikacji",
		"items": "Kredyty Publikacji",
		"subtotal": "Suma czesciowa",
		"vat": "VAT (23%)",
		"total": "Razem",
		"payWith": "Zaplac przez",
		"processing": "Przetwarzanie platnosci...",
		"redirect": "Przekierowanie do operatora platnosci..."
	},
	"providers": {
		"przelewy24": "Przelewy24",
		"przelewy24Description": "BLIK, przelew, karty, Google Pay",
		"tpay": "Tpay",
		"tpayDescription": "BLIK, przelew, karty, Apple Pay"
	},
	"methods": {
		"blik": "BLIK",
		"bankTransfer": "Przelew Bankowy",
		"card": "Karta Platnicza",
		"googlePay": "Google Pay",
		"applePay": "Apple Pay"
	},
	"status": {
		"PENDING": "Oczekujaca",
		"SUCCEEDED": "Zakonczona",
		"FAILED": "Nieudana",
		"REFUNDED": "Zwrocona"
	},
	"source": {
		"PACKAGE": "Zakup Pakietu",
		"GIFT": "Prezent",
		"PROMO": "Promocja",
		"REFUND": "Zwrot",
		"ADMIN": "Przyznane przez Admina",
		"PUBLICATION": "Publikacja",
		"OTHER": "Inne"
	},
	"transaction": {
		"date": "Data",
		"type": "Typ",
		"amount": "Ilosc",
		"balance": "Saldo Po",
		"shortLink": "Powiazany Short"
	},
	"success": {
		"title": "Platnosc Udana!",
		"description": "Twoje kredyty zostaly dodane do konta.",
		"creditsAdded": "Dodano {count} kredytow",
		"viewCredits": "Zobacz Kredyty",
		"continueShopping": "Stworz Shorta"
	},
	"cancel": {
		"title": "Platnosc Anulowana",
		"description": "Twoja platnosc nie zostala zrealizowana.",
		"tryAgain": "Sprobuj Ponownie",
		"backToShorts": "Wroc do Shortsow"
	},
	"errors": {
		"paymentFailed": "Platnosc nie powiodla sie. Sprobuj ponownie.",
		"invalidAmount": "Nieprawidlowa kwota platnosci",
		"providerError": "Blad operatora platnosci. Sprobuj innej metody.",
		"sessionExpired": "Sesja platnosci wygasla. Zacznij ponownie."
	},
	"invoice": {
		"title": "Faktura",
		"download": "Pobierz Fakture",
		"generating": "Generowanie faktury..."
	}
}
```

#### sidebar.json Updates (All 6 Locales)

**Add to existing sidebar.json files:**

```json
// ADD to "company" object in each locale's sidebar.json
"company": {
  "profile": "...",    // existing
  "shorts": "...",     // ADD
  "credits": "..."     // ADD
}
```

| Locale | shorts         | credits    |
| ------ | -------------- | ---------- |
| en     | "My Shorts"    | "Credits"  |
| pl     | "Moje Shortsy" | "Kredyty"  |
| de     | "Meine Shorts" | "Guthaben" |
| es     | "Mis Shorts"   | "Creditos" |
| ru     | "Moi Shortsy"  | "Kredity"  |
| uk     | "Moi Shortsy"  | "Kredyty"  |

#### i18n.ts Update

**File:** `i18n.ts` (root)

**Add imports for shorts and payments namespaces:**

```typescript
// i18n.ts - UPDATE the imports array
const [
	auth,
	common,
	profile,
	settings,
	preferences,
	sidebar,
	companies,
	admin,
	adminCategories,
	categories,
	home,
	shorts, // ADD
	payments, // ADD
] = await Promise.all([
	import(`./src/lib/locales/${locale}/auth.json`),
	import(`./src/lib/locales/${locale}/common.json`),
	import(`./src/lib/locales/${locale}/profile.json`),
	import(`./src/lib/locales/${locale}/settings.json`),
	import(`./src/lib/locales/${locale}/preferences.json`),
	import(`./src/lib/locales/${locale}/sidebar.json`),
	import(`./src/lib/locales/${locale}/companies.json`),
	import(`./src/lib/locales/${locale}/admin.json`),
	import(`./src/lib/locales/${locale}/admin-categories.json`),
	import(`./src/lib/locales/${locale}/categories.json`),
	import(`./src/lib/locales/${locale}/home.json`),
	import(`./src/lib/locales/${locale}/shorts.json`), // ADD
	import(`./src/lib/locales/${locale}/payments.json`), // ADD
]);

return {
	locale,
	messages: {
		auth: auth.default,
		common: common.default,
		profile: profile.default,
		settings: settings.default,
		preferences: preferences.default,
		sidebar: sidebar.default,
		companies: companies.default,
		admin: admin.default,
		"admin-categories": adminCategories.default,
		categories: categories.default,
		home: home.default,
		shorts: shorts.default, // ADD
		payments: payments.default, // ADD
	},
};
```

### 2.4 Component Architecture

#### Components File Structure

```
src/components/shorts/
├── video-upload-wizard.tsx       # Multi-step upload wizard (main component)
├── video-dropzone.tsx            # Drag & drop video upload
├── video-preview.tsx             # Video preview during upload
├── short-player.tsx              # HLS video player (@vidstack/react)
├── short-metadata-form.tsx       # Metadata form (React Hook Form + Zod)
├── tags-autocomplete.tsx         # Tag input with autocomplete (cmdk)
├── thumbnail-selector.tsx        # Auto/custom thumbnail selection
├── processing-status-timeline.tsx # Status timeline component
├── short-card.tsx                # Short card for grid display
├── shorts-table.tsx              # DataTable for management
├── shorts-filters.tsx            # Filter controls
├── publish-dialog.tsx            # Publish confirmation dialog
├── archive-dialog.tsx            # Archive confirmation dialog
├── delete-dialog.tsx             # Delete confirmation dialog
├── renew-dialog.tsx              # Renew confirmation dialog
├── step-indicator.tsx            # Wizard step indicator
└── credits-display.tsx           # Credits balance display

src/components/payments/
├── payment-form.tsx              # Payment provider selection
├── credits-purchase-modal.tsx    # Credits package purchase modal
├── credits-history.tsx           # Transaction history table
└── payment-status-badge.tsx      # Payment status badge
```

#### Component Specifications

##### VideoUploadWizard

**File:** `src/components/shorts/video-upload-wizard.tsx`

```typescript
"use client";

interface VideoUploadWizardProps {
	companyId: string;
	defaultCategoryId?: string;
	defaultLocation?: { lat: number; lng: number; address: string };
	onComplete: (shortId: string) => void;
	onCancel: () => void;
}

// Steps: VIDEO -> METADATA -> THUMBNAIL -> REVIEW
// State machine with validation between steps
// Uses React Hook Form with multi-step form pattern
```

**Reuses:**

- Form components from `src/components/ui/form.tsx`
- Dialog from `src/components/ui/dialog.tsx`

##### VideoDropzone

**File:** `src/components/shorts/video-dropzone.tsx`

```typescript
"use client";

interface VideoDropzoneProps {
	onUploadComplete: (data: {
		key: string;
		duration: number;
		aspectRatio: string;
	}) => void;
	onUploadError: (error: string) => void;
	maxSizeMB?: number; // default: 100
	maxDurationSec?: number; // default: 60
}

// Features:
// - Drag & drop with react-dropzone
// - Client-side validation (format, size)
// - Video duration/aspect ratio detection via HTML5 video element
// - Presigned URL upload with XMLHttpRequest for progress
// - Progress bar display
```

**Reuses:**

- Pattern from `src/components/companies/banner-upload.tsx`

##### ShortPlayer

**File:** `src/components/shorts/short-player.tsx`

```typescript
"use client";

import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import {
	defaultLayoutIcons,
	DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

interface ShortPlayerProps {
	hlsUrl: string;
	posterUrl?: string;
	title: string;
	autoPlay?: boolean;
	muted?: boolean;
	aspectRatio?: "9:16" | "16:9";
	onPlay?: () => void;
	onEnded?: () => void;
	className?: string;
}

// Features:
// - HLS adaptive bitrate streaming
// - Autoplay support
// - Mobile-friendly controls
// - Poster image (thumbnail)
// - 9:16 aspect ratio enforced
```

**Requires:** `npm install @vidstack/react`

##### ShortMetadataForm

**File:** `src/components/shorts/short-metadata-form.tsx`

```typescript
"use client";

interface ShortMetadataFormProps {
	defaultValues?: Partial<ShortMetadataInput>;
	companyCategory?: string;
	companyLocation?: { lat: number; lng: number; address: string };
	onSubmit: (data: ShortMetadataInput) => void;
	onBack?: () => void;
	isSubmitting?: boolean;
}

interface ShortMetadataInput {
	title: string;
	description?: string;
	categoryId: string;
	tags: string[];
	latitude?: number;
	longitude?: number;
	address?: string;
	ctaLink?: string;
}
```

**Reuses:**

- Pattern from `src/components/companies/company-profile-form.tsx`
- `CategoryCombobox` from `src/components/companies/category-combobox.tsx`
- `AddressLocation` from `src/components/companies/address-location.tsx`

##### TagsAutocomplete

**File:** `src/components/shorts/tags-autocomplete.tsx`

```typescript
"use client";

interface TagsAutocompleteProps {
	value: string[];
	onChange: (tags: string[]) => void;
	maxTags?: number; // default: 10
	placeholder?: string;
}

// Features:
// - cmdk-based command menu for search
// - Debounced API search for existing tags
// - Create new tags on Enter
// - Tag chips with remove button
// - Max tags limit
```

**Uses:** `cmdk` (already in dependencies via shadcn)

##### ProcessingStatusTimeline

**File:** `src/components/shorts/processing-status-timeline.tsx`

```typescript
"use client";

interface ProcessingStatusTimelineProps {
	status: ShortStatus;
	paymentStatus?: PaymentStatus;
	processingError?: string;
	estimatedTimeRemaining?: number;
}

// Steps displayed:
// 1. Draft created (always complete)
// 2. Payment received (if applicable)
// 3. Processing video (with spinner when active)
// 4. Publishing soon / Published

// Uses polling (5s interval) or SSE for real-time updates
```

##### ShortsTable

**File:** `src/components/shorts/shorts-table.tsx`

```typescript
"use client";

interface ShortsTableProps {
	shorts: ShortWithStats[];
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onPublish: (id: string) => void;
	onArchive: (id: string) => void;
	onDelete: (id: string) => void;
	onRenew: (id: string) => void;
}

// Columns: thumbnail, title, status, views, created, expires, actions
// Sortable, filterable
// Action dropdown menu per row
```

**Reuses:**

- DataTable pattern from existing admin tables

---

## 3. Backend Architecture

### 3.1 Server Actions

**Directory:** `src/app/actions/shorts/`

#### createShortAction

**File:** `src/app/actions/shorts/create.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createShortSchema } from "@/lib/validation/shorts";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/action-result";
import {
	formatZodError,
	createError,
	createSuccess,
} from "@/lib/types/action-result";

interface CreateShortInput {
	rawVideoKey: string;
	title: string;
	description?: string;
	categoryId: string;
	tags?: string[];
	latitude?: number;
	longitude?: number;
	address?: string;
	ctaLink?: string;
	thumbnailUrl?: string;
	customThumbnail?: boolean;
	duration?: number;
	aspectRatio?: string;
}

export async function createShortAction(
	data: unknown
): Promise<ActionResult<{ shortId: string }>> {
	// 1. AUTH - verify session
	const session = await auth();
	if (!session?.user?.id) {
		return createError("errors.unauthorized", "UNAUTHORIZED");
	}

	// 2. AUTHORIZATION - verify company profile exists and is ACTIVE
	const company = await prisma.companyProfile.findUnique({
		where: { userId: session.user.id },
		select: { id: true, status: true, categoryId: true },
	});
	if (!company) {
		return createError("shorts.errors.unauthorized", "NOT_COMPANY");
	}

	// 3. LIMIT CHECK - max 10 drafts
	const draftCount = await prisma.short.count({
		where: { companyId: company.id, status: "DRAFT" },
	});
	if (draftCount >= 10) {
		return createError("shorts.errors.maxDrafts", "MAX_DRAFTS");
	}

	// 4. VALIDATION
	const parsed = createShortSchema.safeParse(data);
	if (!parsed.success) {
		return formatZodError(parsed.error);
	}

	// 5. CREATE SHORT + TAGS
	try {
		const short = await prisma.$transaction(async (tx) => {
			// Create short
			const newShort = await tx.short.create({
				data: {
					companyId: company.id,
					rawVideoKey: parsed.data.rawVideoKey,
					title: parsed.data.title,
					description: parsed.data.description,
					categoryId: parsed.data.categoryId,
					latitude: parsed.data.latitude,
					longitude: parsed.data.longitude,
					address: parsed.data.address,
					ctaLink: parsed.data.ctaLink,
					thumbnailUrl: parsed.data.thumbnailUrl,
					customThumbnail: parsed.data.customThumbnail ?? false,
					duration: parsed.data.duration,
					aspectRatio: parsed.data.aspectRatio,
					status: "DRAFT",
				},
			});

			// Handle tags
			if (parsed.data.tags?.length) {
				for (const tagName of parsed.data.tags) {
					const tag = await tx.tag.upsert({
						where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
						create: {
							name: tagName,
							slug: tagName.toLowerCase().replace(/\s+/g, "-"),
							usageCount: 1,
						},
						update: { usageCount: { increment: 1 } },
					});
					await tx.shortTag.create({
						data: { shortId: newShort.id, tagId: tag.id },
					});
				}
			}

			// Create stats record
			await tx.shortStats.create({
				data: { shortId: newShort.id },
			});

			return newShort;
		});

		revalidatePath("/panel/shorts");
		return createSuccess({ shortId: short.id });
	} catch (error) {
		console.error("Create short error:", error);
		return createError("shorts.errors.createFailed", "CREATE_FAILED");
	}
}
```

#### updateShortMetadataAction

**File:** `src/app/actions/shorts/update.ts`

```typescript
"use server";

export async function updateShortMetadataAction(
	shortId: string,
	data: unknown
): Promise<ActionResult<Short>> {
	// 1. AUTH
	// 2. AUTHORIZATION - ownership via company profile
	// 3. EXISTENCE CHECK - short exists
	// 4. STATUS CHECK - only DRAFT or PUBLISHED can be edited
	// 5. VALIDATION
	// 6. UPDATE (title, description, tags, ctaLink only for published)
	// 7. revalidatePath
}
```

#### publishShortAction

**File:** `src/app/actions/shorts/publish.ts`

```typescript
"use server";

export async function publishShortAction(
	shortId: string
): Promise<ActionResult<{ redirectUrl?: string; processing?: boolean }>> {
	// 1. AUTH
	// 2. AUTHORIZATION - ownership + company ACTIVE + viesVerified
	// 3. EXISTENCE CHECK - short exists
	// 4. STATUS CHECK - must be DRAFT
	// 5. CREDIT CHECK - user.publicationCredits > 0?
	//    - YES: deduct credit, create CreditTransaction, status -> PROCESSING
	//    - NO: return { redirectUrl: payment checkout URL }
	// 6. Trigger Qencode transcoding (via Inngest)
	// 7. revalidatePath
}
```

#### archiveShortAction

**File:** `src/app/actions/shorts/archive.ts`

```typescript
"use server";

export async function archiveShortAction(
	shortId: string
): Promise<ActionResult<Short>> {
	// 1. AUTH
	// 2. AUTHORIZATION - ownership
	// 3. STATUS CHECK - must be PUBLISHED
	// 4. UPDATE status -> ARCHIVED, archivedAt = now()
	// 5. revalidatePath
}
```

#### deleteShortAction

**File:** `src/app/actions/shorts/delete.ts`

```typescript
"use server";

export async function deleteShortAction(
	shortId: string
): Promise<ActionResult<{ success: boolean }>> {
	// 1. AUTH
	// 2. AUTHORIZATION - ownership
	// 3. STATUS CHECK - must be DRAFT (only drafts can be deleted)
	// 4. DELETE short (cascade deletes tags, stats)
	// 5. DELETE video from R2 if exists
	// 6. revalidatePath
}
```

#### renewShortAction

**File:** `src/app/actions/shorts/renew.ts`

```typescript
"use server";

export async function renewShortAction(
	shortId: string
): Promise<ActionResult<{ redirectUrl: string }>> {
	// 1. AUTH
	// 2. AUTHORIZATION - ownership
	// 3. STATUS CHECK - must be ARCHIVED
	// 4. Create payment checkout for renewal
	// 5. Return redirect URL
}
```

### 3.2 API Routes

#### POST /api/shorts/upload-url

**File:** `src/app/api/shorts/upload-url/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVideoUploadUrl } from "@/lib/r2-video";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	// 1. Auth check
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 2. Company check
	const company = await prisma.companyProfile.findUnique({
		where: { userId: session.user.id },
	});
	if (!company) {
		return NextResponse.json({ error: "Not a company" }, { status: 403 });
	}

	// 3. Parse request
	const { contentType, fileSize } = await request.json();

	// 4. Validate content type
	const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
	if (!allowedTypes.includes(contentType)) {
		return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
	}

	// 5. Validate file size (100MB max)
	if (fileSize > 100 * 1024 * 1024) {
		return NextResponse.json({ error: "File too large" }, { status: 400 });
	}

	// 6. Generate key and presigned URL
	const key = `shorts/${company.id}/${nanoid()}`;
	const uploadUrl = await getVideoUploadUrl({ key, contentType });

	return NextResponse.json({ uploadUrl, key });
}
```

#### POST /api/shorts/thumbnail-url

**File:** `src/app/api/shorts/thumbnail-url/route.ts`

```typescript
// Similar pattern to upload-url but for images bucket
// Key format: thumbnails/{companyId}/{shortId}/{nanoid}.{ext}
// Allowed types: image/jpeg, image/png
// Max size: 2MB
```

#### POST /api/webhooks/qencode

**File:** `src/app/api/webhooks/qencode/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import { verifyQencodeSignature } from "@/lib/qencode";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	// 1. Get raw body for signature verification
	const rawBody = await request.text();
	const signature = request.headers.get("x-qencode-signature");

	// 2. Verify webhook signature
	if (!verifyQencodeSignature(rawBody, signature)) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	// 3. Parse payload
	const payload = JSON.parse(rawBody);
	const { task_id, status, output } = payload;

	// 4. Find short by qencodeTaskId
	const short = await prisma.short.findUnique({
		where: { qencodeTaskId: task_id },
	});
	if (!short) {
		return NextResponse.json({ error: "Short not found" }, { status: 404 });
	}

	// 5. Handle status
	if (status === "completed") {
		// Update short with HLS URL and thumbnail
		await prisma.short.update({
			where: { id: short.id },
			data: {
				hlsPlaylistUrl: output.hls_url,
				thumbnailUrl: short.customThumbnail
					? short.thumbnailUrl
					: output.thumbnail_url,
				status: "PUBLISHED",
				publishedAt: new Date(),
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
			},
		});

		// Trigger cleanup of raw video
		await inngest.send({
			name: "shorts/transcode.completed",
			data: { shortId: short.id, rawVideoKey: short.rawVideoKey },
		});
	} else if (status === "error") {
		// Handle error - increment retry or refund
		const newRetryCount = short.retryCount + 1;

		if (newRetryCount < 3) {
			// Retry transcoding
			await prisma.short.update({
				where: { id: short.id },
				data: { retryCount: newRetryCount, processingError: payload.error },
			});
			await inngest.send({
				name: "shorts/transcode.retry",
				data: { shortId: short.id },
			});
		} else {
			// Max retries - refund credit
			await prisma.short.update({
				where: { id: short.id },
				data: {
					status: "DRAFT",
					processingError: `Transcoding failed after 3 attempts: ${payload.error}`,
				},
			});
			// Trigger refund
			await inngest.send({
				name: "credits/refund",
				data: { shortId: short.id, reason: "transcoding_failed" },
			});
		}
	}

	return NextResponse.json({ received: true });
}
```

#### POST /api/webhooks/przelewy24

**File:** `src/app/api/webhooks/przelewy24/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import { verifyPrzelewy24Signature } from "@/lib/payments/przelewy24";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	// 1. Verify webhook signature (CRC-based)
	const formData = await request.formData();
	const data = Object.fromEntries(formData);

	if (!verifyPrzelewy24Signature(data)) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	// 2. Find payment by session ID
	const payment = await prisma.payment.findUnique({
		where: { providerSessionId: data.sessionId as string },
		include: { short: true },
	});
	if (!payment) {
		return NextResponse.json({ error: "Payment not found" }, { status: 404 });
	}

	// 3. Update payment status
	const status = data.status === "1" ? "SUCCEEDED" : "FAILED";

	await prisma.$transaction(async (tx) => {
		// Update payment
		await tx.payment.update({
			where: { id: payment.id },
			data: {
				status,
				providerPaymentId: data.orderId as string,
			},
		});

		if (status === "SUCCEEDED") {
			// Add credits
			await tx.user.update({
				where: { id: payment.userId },
				data: { publicationCredits: { increment: payment.creditsGranted } },
			});

			// Create credit transaction
			await tx.creditTransaction.create({
				data: {
					userId: payment.userId,
					amount: payment.creditsGranted,
					source: "PACKAGE",
					paymentId: payment.id,
					shortId: payment.shortId,
				},
			});

			// If linked to short, trigger publishing
			if (payment.short && payment.short.status === "PENDING_PAYMENT") {
				await tx.short.update({
					where: { id: payment.shortId! },
					data: { status: "PROCESSING" },
				});

				// Deduct credit for this short
				await tx.user.update({
					where: { id: payment.userId },
					data: { publicationCredits: { decrement: 1 } },
				});

				// Credit transaction for publication
				await tx.creditTransaction.create({
					data: {
						userId: payment.userId,
						amount: -1,
						source: "PUBLICATION",
						shortId: payment.shortId,
					},
				});
			}
		}
	});

	// 4. Trigger transcoding if short linked
	if (status === "SUCCEEDED" && payment.shortId) {
		await inngest.send({
			name: "shorts/transcode.started",
			data: { shortId: payment.shortId },
		});
	}

	return NextResponse.json({ status: "OK" });
}
```

#### POST /api/webhooks/tpay

**File:** `src/app/api/webhooks/tpay/route.ts`

```typescript
// Similar pattern to Przelewy24 but with Tpay-specific signature verification
// Uses MD5 hash with security code
```

#### POST /api/payments/checkout

**File:** `src/app/api/payments/checkout/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrzelewy24Checkout, createTpayCheckout } from "@/lib/payments";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

interface CheckoutRequest {
	provider: "PRZELEWY24" | "TPAY";
	credits: number;
	shortId?: string; // If purchasing for specific short
	returnUrl: string;
	cancelUrl: string;
}

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body: CheckoutRequest = await request.json();

	// Calculate amount based on credits
	const pricePerCredit = 5.0; // PLN, from config
	const amount = body.credits * pricePerCredit;

	// Create payment record
	const payment = await prisma.payment.create({
		data: {
			userId: session.user.id,
			shortId: body.shortId,
			provider: body.provider,
			providerPaymentId: nanoid(), // Temporary, updated by webhook
			amount,
			currency: "PLN",
			status: "PENDING",
			creditsGranted: body.credits,
			metadata: { returnUrl: body.returnUrl, cancelUrl: body.cancelUrl },
		},
	});

	// Update short status if linked
	if (body.shortId) {
		await prisma.short.update({
			where: { id: body.shortId },
			data: { status: "PENDING_PAYMENT" },
		});
	}

	// Create checkout with provider
	let checkoutUrl: string;
	if (body.provider === "PRZELEWY24") {
		checkoutUrl = await createPrzelewy24Checkout({
			sessionId: payment.id,
			amount: Math.round(amount * 100), // Cents
			currency: "PLN",
			description: `${body.credits} publication credits`,
			email: session.user.email!,
			returnUrl: body.returnUrl,
			notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/przelewy24`,
		});
	} else {
		checkoutUrl = await createTpayCheckout({
			// Similar params for Tpay
		});
	}

	// Update payment with provider session ID
	await prisma.payment.update({
		where: { id: payment.id },
		data: { providerSessionId: payment.id }, // Use our ID as session ID
	});

	return NextResponse.json({ checkoutUrl, paymentId: payment.id });
}
```

#### GET /api/payments/status/[id]

**File:** `src/app/api/payments/status/[id]/route.ts`

```typescript
// Returns payment status for polling
// Includes short status if linked
```

#### GET /api/shorts/[id]/status

**File:** `src/app/api/shorts/[id]/status/route.ts`

```typescript
// Returns short status for processing page polling
// Includes estimated time remaining if PROCESSING
```

#### GET /api/tags/search

**File:** `src/app/api/tags/search/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q") || "";

	const tags = await prisma.tag.findMany({
		where: {
			name: { contains: query, mode: "insensitive" },
		},
		orderBy: { usageCount: "desc" },
		take: 10,
		select: { id: true, name: true, usageCount: true },
	});

	return NextResponse.json({ tags });
}
```

### 3.3 Background Jobs (Inngest)

**Directory:** `src/lib/inngest/`

#### Inngest Client Setup

**File:** `src/lib/inngest/client.ts`

```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({
	id: "videoshorts",
	eventKey: process.env.INNGEST_EVENT_KEY,
});
```

#### Event Types

**File:** `src/lib/inngest/events.ts`

```typescript
export type InngestEvents = {
	"shorts/transcode.started": {
		data: { shortId: string };
	};
	"shorts/transcode.completed": {
		data: { shortId: string; rawVideoKey: string };
	};
	"shorts/transcode.retry": {
		data: { shortId: string };
	};
	"shorts/auto-archive": {
		data: {}; // Cron triggered
	};
	"shorts/expiry-reminder": {
		data: { shortId: string };
	};
	"credits/refund": {
		data: { shortId: string; reason: string };
	};
	"payments/verify": {
		data: { paymentId: string };
	};
};
```

#### Function: Start Transcoding

**File:** `src/lib/inngest/functions/process-video.ts`

```typescript
import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { startQencodeJob } from "@/lib/qencode";
import { getVideoDownloadUrl } from "@/lib/r2-video";

export const startTranscoding = inngest.createFunction(
	{ id: "start-transcoding", name: "Start Video Transcoding" },
	{ event: "shorts/transcode.started" },
	async ({ event, step }) => {
		const { shortId } = event.data;

		// Get short
		const short = await step.run("get-short", async () => {
			return prisma.short.findUnique({
				where: { id: shortId },
				include: { company: true },
			});
		});

		if (!short || !short.rawVideoKey) {
			throw new Error("Short or raw video not found");
		}

		// Get presigned URL for Qencode to read from R2
		const inputUrl = await step.run("get-input-url", async () => {
			return getVideoDownloadUrl({ key: short.rawVideoKey!, expiresIn: 3600 });
		});

		// Start Qencode job
		const taskId = await step.run("start-qencode", async () => {
			return startQencodeJob({
				inputUrl,
				outputBucket: process.env.R2_VIDEO_HLS_BUCKET!,
				outputPath: `shorts/${shortId}`,
				webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/qencode`,
			});
		});

		// Update short with task ID
		await step.run("update-short", async () => {
			return prisma.short.update({
				where: { id: shortId },
				data: { qencodeTaskId: taskId },
			});
		});

		return { taskId };
	}
);
```

#### Function: Cleanup Raw Video

**File:** `src/lib/inngest/functions/cleanup-video.ts`

```typescript
import { inngest } from "../client";
import { deleteVideoObject } from "@/lib/r2-video";

export const cleanupRawVideo = inngest.createFunction(
	{ id: "cleanup-raw-video", name: "Cleanup Raw Video from R2" },
	{ event: "shorts/transcode.completed" },
	async ({ event, step }) => {
		const { rawVideoKey } = event.data;

		if (rawVideoKey) {
			await step.run("delete-raw", async () => {
				return deleteVideoObject(rawVideoKey);
			});
		}

		return { cleaned: true };
	}
);
```

#### Function: Auto-Archive Expired Shorts

**File:** `src/lib/inngest/functions/archive-expired.ts`

```typescript
import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const archiveExpiredShorts = inngest.createFunction(
	{ id: "archive-expired-shorts", name: "Auto-Archive Expired Shorts" },
	{ cron: "0 3 * * *" }, // Daily at 3 AM
	async ({ step }) => {
		// Find expired shorts
		const expiredShorts = await step.run("find-expired", async () => {
			return prisma.short.findMany({
				where: {
					status: "PUBLISHED",
					expiresAt: { lte: new Date() },
				},
				select: { id: true },
			});
		});

		// Archive each short
		const archived = await step.run("archive-shorts", async () => {
			return prisma.short.updateMany({
				where: { id: { in: expiredShorts.map((s) => s.id) } },
				data: {
					status: "ARCHIVED",
					archivedAt: new Date(),
				},
			});
		});

		return { archivedCount: archived.count };
	}
);
```

#### Function: Send Expiry Reminder

**File:** `src/lib/inngest/functions/expiry-reminder.ts`

```typescript
import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { sendExpiryReminderEmail } from "@/lib/email";

export const sendExpiryReminders = inngest.createFunction(
	{ id: "send-expiry-reminders", name: "Send 7-Day Expiry Reminders" },
	{ cron: "0 9 * * *" }, // Daily at 9 AM
	async ({ step }) => {
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

		// Find shorts expiring in 7 days
		const expiringShorts = await step.run("find-expiring", async () => {
			return prisma.short.findMany({
				where: {
					status: "PUBLISHED",
					expiresAt: {
						gte: new Date(sevenDaysFromNow.setHours(0, 0, 0, 0)),
						lt: new Date(sevenDaysFromNow.setHours(23, 59, 59, 999)),
					},
				},
				include: {
					company: {
						include: { user: true },
					},
				},
			});
		});

		// Send reminder emails
		for (const short of expiringShorts) {
			await step.run(`send-reminder-${short.id}`, async () => {
				return sendExpiryReminderEmail({
					to: short.company.user.email,
					shortTitle: short.title,
					shortId: short.id,
					expiresAt: short.expiresAt!,
				});
			});
		}

		return { remindersSent: expiringShorts.length };
	}
);
```

#### Inngest API Route

**File:** `src/app/api/inngest/route.ts`

```typescript
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { startTranscoding } from "@/lib/inngest/functions/process-video";
import { cleanupRawVideo } from "@/lib/inngest/functions/cleanup-video";
import { archiveExpiredShorts } from "@/lib/inngest/functions/archive-expired";
import { sendExpiryReminders } from "@/lib/inngest/functions/expiry-reminder";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [
		startTranscoding,
		cleanupRawVideo,
		archiveExpiredShorts,
		sendExpiryReminders,
	],
});
```

---

## 4. External Service Integration

### 4.1 Cloudflare R2

#### R2 Video Module

**File:** `src/lib/r2-video.ts`

```typescript
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Separate client for video buckets (may have different credentials)
const r2VideoClient = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT!,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
});

const VIDEO_RAW_BUCKET = process.env.R2_VIDEO_RAW_BUCKET!;
const VIDEO_HLS_BUCKET = process.env.R2_VIDEO_HLS_BUCKET!;

export interface VideoUploadUrlOptions {
	key: string;
	contentType: string;
	expiresIn?: number; // default: 3600 (1 hour)
}

export async function getVideoUploadUrl({
	key,
	contentType,
	expiresIn = 3600,
}: VideoUploadUrlOptions): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: VIDEO_RAW_BUCKET,
		Key: key,
		ContentType: contentType,
	});
	return getSignedUrl(r2VideoClient, command, { expiresIn });
}

export async function getVideoDownloadUrl({
	key,
	expiresIn = 3600,
}: {
	key: string;
	expiresIn?: number;
}): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: VIDEO_RAW_BUCKET,
		Key: key,
	});
	return getSignedUrl(r2VideoClient, command, { expiresIn });
}

export function getHlsPublicUrl(key: string): string {
	const baseUrl =
		process.env.R2_VIDEO_HLS_PUBLIC_URL || `https://${VIDEO_HLS_BUCKET}.r2.dev`;
	return `${baseUrl}/${key}`;
}

export async function deleteVideoObject(key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: VIDEO_RAW_BUCKET,
		Key: key,
	});
	await r2VideoClient.send(command);
}
```

#### R2 Bucket Configuration

**video-raw bucket:**

- Private (no public access)
- Lifecycle rule: Delete objects older than 24 hours
- CORS: Allow PUT from localhost:3000 and production domain

**video-hls bucket:**

- Public access enabled
- CDN caching enabled
- No lifecycle rule (permanent storage)
- CORS: Allow GET from any origin

#### CORS Configuration Example

```json
{
	"CORSRules": [
		{
			"AllowedOrigins": ["http://localhost:3000", "https://videoffers.com"],
			"AllowedMethods": ["GET", "PUT", "HEAD"],
			"AllowedHeaders": ["*"],
			"ExposeHeaders": ["ETag"],
			"MaxAgeSeconds": 3600
		}
	]
}
```

### 4.2 Qencode

#### Qencode Client

**File:** `src/lib/qencode.ts`

```typescript
import crypto from "crypto";

const QENCODE_API_URL = "https://api.qencode.com/v1";
const QENCODE_API_KEY = process.env.QENCODE_API_KEY!;
const QENCODE_WEBHOOK_SECRET = process.env.QENCODE_WEBHOOK_SECRET!;

interface QencodeJobOptions {
	inputUrl: string;
	outputBucket: string;
	outputPath: string;
	webhookUrl: string;
}

export async function startQencodeJob({
	inputUrl,
	outputBucket,
	outputPath,
	webhookUrl,
}: QencodeJobOptions): Promise<string> {
	// Get access token
	const tokenResponse = await fetch(`${QENCODE_API_URL}/access_token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ api_key: QENCODE_API_KEY }),
	});
	const { token } = await tokenResponse.json();

	// Create transcoding task
	const taskResponse = await fetch(`${QENCODE_API_URL}/create_task`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ token }),
	});
	const { task_token } = await taskResponse.json();

	// Start task with HLS profile
	const query = {
		source: inputUrl,
		format: [
			{
				output: "advanced_hls",
				destination: {
					url: `s3://${outputBucket}/${outputPath}/`,
					key: process.env.R2_ACCESS_KEY_ID,
					secret: process.env.R2_SECRET_ACCESS_KEY,
					endpoint: process.env.R2_ENDPOINT,
				},
				stream: [
					{
						video_codec: "libx264",
						height: 1920,
						width: 1080,
						bitrate: 4500,
						profile: "high",
					},
					{
						video_codec: "libx264",
						height: 1280,
						width: 720,
						bitrate: 2500,
						profile: "main",
					},
					{
						video_codec: "libx264",
						height: 854,
						width: 480,
						bitrate: 1000,
						profile: "main",
					},
				],
				segment_duration: 4,
			},
		],
		callback_url: webhookUrl,
	};

	await fetch(`${QENCODE_API_URL}/start_encode`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			task_token,
			query: JSON.stringify(query),
		}),
	});

	return task_token;
}

export function verifyQencodeSignature(
	rawBody: string,
	signature: string | null
): boolean {
	if (!signature) return false;

	const expectedSignature = crypto
		.createHmac("sha256", QENCODE_WEBHOOK_SECRET)
		.update(rawBody)
		.digest("hex");

	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expectedSignature)
	);
}
```

### 4.3 Payment Providers

#### Payment Abstraction Layer

**File:** `src/lib/payments/index.ts`

```typescript
export interface CheckoutOptions {
	sessionId: string;
	amount: number; // in cents
	currency: string;
	description: string;
	email: string;
	returnUrl: string;
	notifyUrl: string;
}

export interface PaymentProvider {
	createCheckout(options: CheckoutOptions): Promise<string>;
	verifyWebhook(data: unknown): boolean;
}

export {
	createPrzelewy24Checkout,
	verifyPrzelewy24Signature,
} from "./przelewy24";
export { createTpayCheckout, verifyTpaySignature } from "./tpay";
```

#### Przelewy24 Integration

**File:** `src/lib/payments/przelewy24.ts`

```typescript
import crypto from "crypto";

const P24_MERCHANT_ID = process.env.PRZELEWY24_MERCHANT_ID!;
const P24_CRC = process.env.PRZELEWY24_CRC!;
const P24_API_KEY = process.env.PRZELEWY24_API_KEY!;
const P24_SANDBOX = process.env.NODE_ENV !== "production";

const P24_BASE_URL = P24_SANDBOX
	? "https://sandbox.przelewy24.pl"
	: "https://secure.przelewy24.pl";

interface P24CheckoutOptions {
	sessionId: string;
	amount: number;
	currency: string;
	description: string;
	email: string;
	returnUrl: string;
	notifyUrl: string;
}

export async function createPrzelewy24Checkout({
	sessionId,
	amount,
	currency,
	description,
	email,
	returnUrl,
	notifyUrl,
}: P24CheckoutOptions): Promise<string> {
	// Generate CRC signature
	const signData = `${sessionId}|${P24_MERCHANT_ID}|${amount}|${currency}|${P24_CRC}`;
	const sign = crypto.createHash("sha384").update(signData).digest("hex");

	// Register transaction
	const response = await fetch(`${P24_BASE_URL}/api/v1/transaction/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Basic ${Buffer.from(`${P24_MERCHANT_ID}:${P24_API_KEY}`).toString("base64")}`,
		},
		body: JSON.stringify({
			merchantId: parseInt(P24_MERCHANT_ID),
			posId: parseInt(P24_MERCHANT_ID),
			sessionId,
			amount,
			currency,
			description,
			email,
			country: "PL",
			language: "pl",
			urlReturn: returnUrl,
			urlStatus: notifyUrl,
			sign,
		}),
	});

	const data = await response.json();

	if (data.error) {
		throw new Error(`P24 Error: ${data.error}`);
	}

	return `${P24_BASE_URL}/trnRequest/${data.data.token}`;
}

export function verifyPrzelewy24Signature(
	data: Record<string, unknown>
): boolean {
	const {
		merchantId,
		posId,
		sessionId,
		amount,
		originAmount,
		currency,
		orderId,
		methodId,
		statement,
		sign,
	} = data;

	const signData = `${sessionId}|${orderId}|${amount}|${currency}|${P24_CRC}`;
	const expectedSign = crypto
		.createHash("sha384")
		.update(signData)
		.digest("hex");

	return sign === expectedSign;
}
```

#### Tpay Integration

**File:** `src/lib/payments/tpay.ts`

```typescript
import crypto from "crypto";

const TPAY_MERCHANT_ID = process.env.TPAY_MERCHANT_ID!;
const TPAY_SECURITY_CODE = process.env.TPAY_SECURITY_CODE!;
const TPAY_API_KEY = process.env.TPAY_API_KEY!;

export async function createTpayCheckout({
	sessionId,
	amount,
	currency,
	description,
	email,
	returnUrl,
	notifyUrl,
}: {
	sessionId: string;
	amount: number;
	currency: string;
	description: string;
	email: string;
	returnUrl: string;
	notifyUrl: string;
}): Promise<string> {
	// Tpay expects amount in PLN (not cents)
	const amountPLN = amount / 100;

	// Generate MD5 checksum
	const checksum = crypto
		.createHash("md5")
		.update(
			`${TPAY_MERCHANT_ID}&${amountPLN}&${sessionId}&${TPAY_SECURITY_CODE}`
		)
		.digest("hex");

	const response = await fetch("https://secure.tpay.com/api/gw/transactions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${TPAY_API_KEY}`,
		},
		body: JSON.stringify({
			id: TPAY_MERCHANT_ID,
			amount: amountPLN,
			crc: sessionId,
			description,
			email,
			return_url: returnUrl,
			result_url: notifyUrl,
			md5sum: checksum,
		}),
	});

	const data = await response.json();
	return data.url;
}

export function verifyTpaySignature(data: Record<string, unknown>): boolean {
	const {
		id,
		tr_id,
		tr_date,
		tr_crc,
		tr_amount,
		tr_paid,
		tr_desc,
		tr_status,
		tr_error,
		tr_email,
		md5sum,
	} = data;

	const expectedMd5 = crypto
		.createHash("md5")
		.update(`${id}${tr_id}${tr_amount}${tr_crc}${TPAY_SECURITY_CODE}`)
		.digest("hex");

	return md5sum === expectedMd5;
}
```

---

## 5. Data Flow Diagrams

### 5.1 Video Upload Flow

```
User selects video file
        |
        v
Client-side validation
(format, size, duration check)
        |
        v
POST /api/shorts/upload-url
        |
        v
Server generates presigned PUT URL
(R2 video-raw bucket)
        |
        v
Client uploads directly to R2
(XMLHttpRequest with progress)
        |
        v
Upload complete, key returned
        |
        v
User fills metadata form
        |
        v
createShortAction()
        |
        v
Short record created (DRAFT)
        |
        v
Redirect to /panel/shorts/[id]
```

### 5.2 Publish Flow (With Credits)

```
User clicks "Publish"
        |
        v
publishShortAction()
        |
        v
Check user.publicationCredits > 0
        |
       YES
        |
        v
Deduct 1 credit
Create CreditTransaction (source: PUBLICATION)
Update Short status -> PROCESSING
        |
        v
inngest.send("shorts/transcode.started")
        |
        v
Inngest function: startTranscoding
        |
        v
Get presigned download URL from R2 raw
        |
        v
Call Qencode API to start transcoding
        |
        v
Update Short.qencodeTaskId
        |
        v
[Wait for webhook]
        |
        v
POST /api/webhooks/qencode (status: completed)
        |
        v
Update Short:
- hlsPlaylistUrl = output URL
- thumbnailUrl (if auto)
- status = PUBLISHED
- publishedAt = now
- expiresAt = now + 30 days
        |
        v
inngest.send("shorts/transcode.completed")
        |
        v
Delete raw video from R2
        |
        v
Short is LIVE!
```

### 5.3 Publish Flow (Without Credits - Payment Required)

```
User clicks "Publish"
        |
        v
publishShortAction()
        |
        v
Check user.publicationCredits > 0
        |
       NO
        |
        v
Return { redirectUrl: null, requiresPayment: true }
        |
        v
Frontend shows payment modal
User selects provider (P24/Tpay)
        |
        v
POST /api/payments/checkout
        |
        v
Create Payment record (PENDING)
Update Short status -> PENDING_PAYMENT
Generate provider checkout URL
        |
        v
Redirect to payment provider
        |
        v
User completes payment
        |
        v
POST /api/webhooks/przelewy24 (status: success)
        |
        v
Update Payment status = SUCCEEDED
Add credits to user
Create CreditTransaction (source: PACKAGE)
        |
        v
If Short linked:
- Deduct 1 credit
- Create CreditTransaction (source: PUBLICATION)
- Update Short status -> PROCESSING
        |
        v
inngest.send("shorts/transcode.started")
        |
        v
[Continue transcoding flow...]
```

### 5.4 Auto-Archive Flow

```
Cron: Daily at 3 AM
        |
        v
Inngest: archiveExpiredShorts
        |
        v
Find all PUBLISHED shorts where expiresAt <= now
        |
        v
Update all to:
- status = ARCHIVED
- archivedAt = now
        |
        v
Short removed from feed
(Still accessible via direct link)
```

### 5.5 Renewal Flow

```
User views ARCHIVED short
Clicks "Renew"
        |
        v
renewShortAction()
        |
        v
Create Payment checkout (same as publish)
        |
        v
[Payment flow...]
        |
        v
On payment success:
- Update Short.publishedAt = now
- Update Short.expiresAt = now + 30 days
- Update Short.status = PUBLISHED
- Clear archivedAt
        |
        v
Short visible in feed again!
```

---

## 6. Security Considerations

### 6.1 Webhook Signature Verification

All webhooks MUST verify signatures before processing:

```typescript
// Qencode: HMAC-SHA256
const expectedSignature = crypto
	.createHmac("sha256", QENCODE_WEBHOOK_SECRET)
	.update(rawBody)
	.digest("hex");

// Przelewy24: SHA384 hash
const signData = `${sessionId}|${orderId}|${amount}|${currency}|${P24_CRC}`;
const expectedSign = crypto.createHash("sha384").update(signData).digest("hex");

// Tpay: MD5 hash
const expectedMd5 = crypto
	.createHash("md5")
	.update(`${id}${tr_id}${tr_amount}${tr_crc}${TPAY_SECURITY_CODE}`)
	.digest("hex");
```

### 6.2 R2 Bucket Access Policies

**video-raw bucket:**

- NO public access
- Presigned URLs expire after 1 hour
- Only used for upload and transcoding input
- Lifecycle rule deletes after 24 hours

**video-hls bucket:**

- Public read access for CDN
- Only Qencode writes to this bucket
- No direct user uploads

### 6.3 Payment Amount Validation

```typescript
// Server-side validation
const PRICE_PER_CREDIT = 5.0; // PLN
const VALID_PACKAGES = [1, 5, 20, 50];

function validatePaymentAmount(credits: number, amount: number): boolean {
	if (!VALID_PACKAGES.includes(credits)) return false;
	const expectedAmount = credits * PRICE_PER_CREDIT;
	return Math.abs(amount - expectedAmount) < 0.01;
}
```

### 6.4 Rate Limiting

**File upload rate limiting:**

- Max 10 uploads per hour per company
- Implemented via middleware or API route check

```typescript
// Check rate limit before generating presigned URL
const uploadCount = await prisma.short.count({
	where: {
		companyId,
		createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
	},
});

if (uploadCount >= 10) {
	return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

### 6.5 File Type Validation

**Client-side (first line of defense):**

```typescript
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

function validateVideoFile(file: File): boolean {
	return (
		ALLOWED_VIDEO_TYPES.includes(file.type) && file.size <= 100 * 1024 * 1024
	);
}
```

**Server-side (before generating presigned URL):**

```typescript
// Validate in API route
if (!["video/mp4", "video/quicktime", "video/webm"].includes(contentType)) {
	return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
}
```

### 6.6 Company Verification Check

```typescript
// Before allowing publish
const company = await prisma.companyProfile.findUnique({
	where: { userId: session.user.id },
	select: { status: true, viesVerified: true },
});

if (company.status !== "ACTIVE" || !company.viesVerified) {
	return createError("shorts.errors.notVerified", "NOT_VERIFIED");
}
```

---

## 7. Component Reuse Matrix

| New Component            | Reuses From          | Pattern/Code                           |
| ------------------------ | -------------------- | -------------------------------------- |
| VideoDropzone            | `BannerUpload`       | Drag & drop, file validation, progress |
| ShortMetadataForm        | `CompanyProfileForm` | React Hook Form + Zod, field layout    |
| ThumbnailSelector        | `AvatarUpload`       | R2 presigned upload pattern            |
| ShortsTable              | Admin tables         | DataTable columns, actions dropdown    |
| TagsAutocomplete         | `CategoryCombobox`   | cmdk Command component pattern         |
| ShortPlayer              | New (Vidstack)       | -                                      |
| ProcessingStatusTimeline | New                  | -                                      |
| CreditsDisplay           | New                  | -                                      |
| PaymentForm              | New                  | -                                      |

### Existing Utilities to Use

| Utility           | Path                             | Use For                     |
| ----------------- | -------------------------------- | --------------------------- |
| `getUploadUrl`    | `src/lib/r2.ts`                  | Extend for video buckets    |
| `ActionResult`    | `src/lib/types/action-result.ts` | All server actions          |
| `useTranslations` | `src/lib/i18n/client.ts`         | All client components       |
| `getTranslations` | `src/lib/i18n/server.ts`         | All server components       |
| `cn()`            | `src/lib/utils.ts`               | Class merging               |
| `toast`           | `sonner`                         | Success/error notifications |

---

## 8. NPM Packages to Install

```bash
# Video player
npm install @vidstack/react

# Background jobs
npm install inngest
```

---

## 9. Environment Variables

Add to `.env`:

```env
# R2 Video Buckets
R2_VIDEO_RAW_BUCKET=videoshorts-raw
R2_VIDEO_HLS_BUCKET=videoshorts-hls
R2_VIDEO_HLS_PUBLIC_URL=https://cdn.videoffers.com

# Qencode
QENCODE_API_KEY=your_qencode_api_key
QENCODE_WEBHOOK_SECRET=your_webhook_secret

# Przelewy24
PRZELEWY24_MERCHANT_ID=your_merchant_id
PRZELEWY24_CRC=your_crc_key
PRZELEWY24_API_KEY=your_api_key

# Tpay
TPAY_MERCHANT_ID=your_merchant_id
TPAY_SECURITY_CODE=your_security_code
TPAY_API_KEY=your_api_key

# Inngest
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

---

## 10. Implementation Priority

### Phase 1: Core Infrastructure (P0)

1. Database migration (Mux -> Qencode field rename)
2. Install packages (@vidstack/react, inngest)
3. R2 video module (`src/lib/r2-video.ts`)
4. Translation files creation

### Phase 2: Upload Flow (P0)

5. Video upload API route
6. VideoDropzone component
7. VideoUploadWizard component
8. createShortAction server action

### Phase 3: Video Processing (P0)

9. Qencode integration
10. Inngest setup + transcoding functions
11. ProcessingStatusTimeline component
12. Webhook handlers

### Phase 4: Payments (P0)

13. Payment providers integration (P24, Tpay)
14. Credits system
15. Payment webhooks
16. publishShortAction

### Phase 5: Management UI (P1)

17. ShortsTable component
18. Short detail page
19. Edit metadata functionality
20. Navigation updates

### Phase 6: Lifecycle (P2)

21. Auto-archive cron job
22. Expiry reminder emails
23. Renewal flow
24. Archive/delete functionality

---

## Summary

This architecture provides:

1. **Complete Prisma schema** with field rename migration strategy
2. **Full navigation code** for app-sidebar.tsx
3. **All translation keys** for 6 locales (shorts.json, payments.json, sidebar updates)
4. **Detailed component specifications** with file paths and interfaces
5. **Server actions** following existing patterns (ActionResult)
6. **API routes** for uploads, webhooks, and payments
7. **Inngest background jobs** for transcoding and lifecycle management
8. **External service integrations** (R2, Qencode, P24, Tpay)
9. **Data flow diagrams** for all major flows
10. **Security considerations** with implementation details
11. **Component reuse matrix** maximizing existing code
