# Etap 2: Companies + Verification

**Projekt:** VideoShorts
**Priorytet:** P0 (Critical - MVP)
**Zależności:** Etap 1 (Core + Auth)
**Szacowany czas:** 2 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

Umożliwienie użytkownikom upgrade'u do konta firmowego, weryfikacja firm przez VIES API (NIP), tworzenie publicznych profili firmowych, oraz podstawowy system kategorii. Ten etap przygotowuje firmy do publikowania shortsów w kolejnym etapie.

### Kluczowe Wartości:
- Weryfikacja tożsamości firm przez oficjalny EU VIES API
- Publiczne profile firmowe z SEO-friendly URLs
- System kategorii dla organizacji treści
- Fundament panelu administracyjnego

---

## 2. Funkcjonalności

### 2.1 Upgrade do Konta Firmowego

**Proces:**
- User w settings może upgrade'ować do Company account
- Formularz z danymi firmowymi:
  - Nazwa firmy
  - NIP (walidacja formatu polskiego NIP)
  - Adres siedziby
  - Email kontaktowy
  - Telefon (opcjonalny)
- Po wypełnieniu → automatyczna weryfikacja VIES

**Wymagania:**
- Wymagane zweryfikowane konto email (z etapu 1)
- NIP musi być unikalny w systemie
- Jeden user = jedna firma

### 2.2 Weryfikacja VIES

**Automatyczna weryfikacja:**
- Integracja z VIES API (EU VAT validation)
- Sprawdzenie czy NIP jest aktywny i prawidłowy
- Zapisanie danych z VIES (nazwa firmy, adres)
- Badge "Zweryfikowana firma" na profilu

**Manual verification (fallback):**
- Jeśli VIES API niedostępny → pending manual review
- Admin może ręcznie zweryfikować firmę
- Opcja re-weryfikacji (cron job co 6 miesięcy)

### 2.3 Profil Firmowy

**Publiczny profil:**
- URL: `/companies/[slug]` (SEO-friendly, np. `/companies/kowalska-cukiernia`)
- Logo (upload, max 5MB, min 200x200px)
- Banner (upload, max 10MB, 1920x400px)
- Opis firmy (markdown, max 2000 znaków)
- Kategoria główna (single select)
- Subcategories (multi-select, max 3)
- Linki: website, Facebook, Instagram, TikTok
- Lokalizacja (Mapbox, coordinates + address)
- Godziny otwarcia (opcjonalne, struktura JSON)

**Statystyki (placeholder):**
- Liczba shortsów: 0 (na początku)
- Followers: 0
- Total views: 0
- Data dołączenia

**Edycja:**
- Strona `/dashboard/settings` (tylko dla firm)
- Możliwość edycji wszystkich pól (poza NIP)
- Real-time preview profilu

### 2.4 System Kategorii

**Kategorie (seed data):**
- Hierarchia: kategoria → podkategorie
- Przykłady:
  - Jedzenie i Napoje
    - Restauracje
    - Kawiarnie
    - Catering
  - Usługi
    - Fryzjerzy
    - Mechanicy
    - Serwis IT
  - Retail
    - Odzież
    - Elektronika
    - Meble

**CRUD (Admin):**
- Lista kategorii w admin panel
- Dodawanie nowej kategorii
- Edycja nazwy, ikony, kolejności
- Usuwanie (tylko jeśli brak powiązanych firm)
- Drag & drop sortowanie

**Ikony:**
- Upload SVG (max 1MB)
- Lub wybór z biblioteki (Lucide Icons)

### 2.5 Panel Administracyjny (Podstawy)

**Navigation:**
- Dostęp: `/admin` (tylko role: ADMIN)
- Sidebar z sekcjami:
  - Dashboard (placeholder)
  - Moderation Queue (placeholder)
  - Companies (lista firm)
  - Categories
  - Users (lista użytkowników)
  - Settings

**Companies Management:**
- Lista wszystkich firm (table)
- Filtry: verified/unverified, kategoria
- Search: nazwa, NIP
- Akcje:
  - View profile
  - Verify manually (jeśli VIES failed)
  - Reject verification
  - Ban/suspend company
- Szczegóły firmy (modal):
  - Wszystkie dane
  - VIES verification history
  - Audit log (akcje adminów)

**Users Management:**
- Lista wszystkich użytkowników (table)
- Filtry: role, verified/unverified, banned
- Search: email, display name
- Akcje:
  - View profile
  - Change role (USER ↔ COMPANY ↔ ADMIN)
  - Ban/suspend (funkcja w etapie 6, ale UI gotowe)
  - Delete account (admin override)

---

## 3. User Stories

### US-02-01: Upgrade do Konta Firmowego
**Jako** użytkownik
**Chcę** upgrade'ować moje konto do konta firmowego
**Aby** móc publikować shorty

**Kryteria akceptacji:**
- [ ] Link "Upgrade to Company" w user settings
- [ ] Formularz z polami: company name, NIP, address, contact email, phone
- [ ] Walidacja: NIP format (PL: 10 cyfr lub XX-XXX-XXX-XX), unique NIP
- [ ] Po submit → VIES API check (loading state)
- [ ] Jeśli success: user.role → COMPANY, CompanyProfile created, redirect do `/dashboard`
- [ ] Jeśli VIES fail: manual review queue, notification "Verification pending"
- [ ] Jeśli error: clear error message (NIP already exists, invalid format, VIES unavailable)

### US-02-02: Edycja Profilu Firmowego
**Jako** firma
**Chcę** edytować mój profil firmowy
**Aby** przedstawić swoją działalność klientom

**Kryteria akceptacji:**
- [ ] Strona `/dashboard/settings` z formularzem
- [ ] Upload logo: max 5MB, PNG/JPG, min 200x200px, crop tool
- [ ] Upload banner: max 10MB, PNG/JPG, 1920x400px, crop tool
- [ ] Opis: markdown editor z preview (max 2000 znaków)
- [ ] Kategoria: dropdown z hierarchiczną strukturą
- [ ] Subcategories: multi-select (max 3)
- [ ] Social links: Facebook, Instagram, TikTok URLs (validation)
- [ ] Lokalizacja: Mapbox autocomplete
- [ ] Godziny otwarcia: optional, time picker dla każdego dnia
- [ ] Save button → API call → success toast
- [ ] Preview button → modal z renderowanym profilem

### US-02-03: Publiczny Profil Firmy
**Jako** użytkownik (przeglądający)
**Chcę** zobaczyć profil firmy
**Aby** poznać jej ofertę

**Kryteria akceptacji:**
- [ ] URL: `/companies/[slug]` (slug z nazwy firmy)
- [ ] Layout: banner (top), logo (overlay), nazwa, badge (verified), kategoria
- [ ] Sekcje: About (opis markdown), Location (Mapbox map), Hours (opcjonalne)
- [ ] Social links (ikony)
- [ ] Statystyki: shorty count, followers, total views (placeholder 0)
- [ ] Lista shortsów (placeholder "No shorts yet" w tym etapie)
- [ ] Follow button (placeholder, funkcja w etapie 5)
- [ ] SEO: meta tags (title, description, OG image)
- [ ] Mobile responsive

### US-02-04: Admin - Weryfikacja Firmy
**Jako** admin
**Chcę** manualnie zweryfikować firmę
**Aby** umożliwić jej publikowanie shortsów gdy VIES API zawiodło

**Kryteria akceptacji:**
- [ ] Lista firm w `/admin/companies`
- [ ] Filter: "Pending verification"
- [ ] Dla każdej firmy: NIP, nazwa, data rejestracji, VIES status
- [ ] Actions: Verify, Reject, View details
- [ ] Verify → CompanyProfile.viesVerified = true, email notification
- [ ] Reject → email z powodem, CompanyProfile.deleted (soft delete)
- [ ] Audit log: zapisanie akcji admina

### US-02-05: Admin - Zarządzanie Kategoriami
**Jako** admin
**Chcę** zarządzać kategoriami
**Aby** organizować treści na platformie

**Kryteria akceptacji:**
- [ ] Strona `/admin/categories`
- [ ] Lista kategorii (hierarchical tree view)
- [ ] Actions: Add, Edit, Delete, Reorder (drag & drop)
- [ ] Add category modal: name, slug (auto-generated), icon (upload SVG or select)
- [ ] Edit modal: update name, slug, icon, parent (zmiana hierarchii)
- [ ] Delete: tylko jeśli brak powiązanych firm (warning message)
- [ ] Reorder: zapisuje order field, auto-sort w UI
- [ ] Preview: jak kategoria wygląda w UI

---

## 4. Wymagania Biznesowe

### 4.1 Weryfikacja
- Tylko zweryfikowane firmy mogą publikować shorty
- NIP musi być unikalny w systemie
- VIES verification wymagana dla EU firms
- Manual verification dla non-EU (post-MVP) lub gdy VIES down
- Re-verification co 6 miesięcy (background job)

### 4.2 Kategorie
- Minimum 10 kategorii głównych (seed data)
- Maksymalnie 2 poziomy hierarchii (kategoria → podkategoria)
- Firma wybiera 1 kategorię główną + max 3 subcategories
- Kategorie mogą być disable'd (hidden) ale nie usuwane jeśli mają firms

### 4.3 Profil Firmowy
- Slug musi być unikalny (auto-generated z nazwy + suffix jeśli konflikt)
- Logo required, banner optional
- Description required (min 100 znaków)
- Location required (coordinates)
- Social links optional

### 4.4 Role Management
- Tylko ADMIN może zmieniać role innych users
- USER → COMPANY: through upgrade flow (self-service)
- COMPANY → USER: nie dozwolone (jedna firma = zawsze COMPANY)
- USER → ADMIN: tylko przez innego admina

---

## 5. Wymagania Techniczne

### 5.1 Database Schema Changes

```prisma
model User {
  // ... existing fields
  companyProfile CompanyProfile?
}

model CompanyProfile {
  id           String    @id @default(cuid())
  userId       String    @unique
  companyName  String
  slug         String    @unique // SEO-friendly URL
  nip          String    @unique
  viesVerified Boolean   @default(false)
  verifiedAt   DateTime?
  verifiedBy   String?   // Admin userId jeśli manual
  logo         String?   // R2 URL
  banner       String?   // R2 URL
  description  String    @db.Text // Markdown
  categoryId   String
  subcategories Json?    // Array<string> category IDs
  website      String?
  socialLinks  Json?     // {facebook, instagram, tiktok}
  latitude     Float
  longitude    Float
  address      String
  phone        String?
  businessHours Json?    // {monday: {open: "09:00", close: "17:00"}, ...}
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId])
  @@index([slug])
  @@index([nip])
  @@index([categoryId])
  @@index([viesVerified])
  @@index([latitude, longitude])
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?  // SVG URL or Lucide icon name
  parentId  String?
  order     Int      @default(0)
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent          Category?        @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[]       @relation("CategoryHierarchy")
  companyProfiles CompanyProfile[]

  @@index([slug])
  @@index([parentId])
  @@index([enabled])
  @@index([order])
}

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // "VERIFY_COMPANY", "REJECT_COMPANY", "BAN_USER", etc.
  targetType String   // "USER", "COMPANY", "CATEGORY"
  targetId   String
  metadata   Json?    // {reason: "", previousStatus: "", etc.}
  createdAt  DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### 5.2 API Endpoints

**Company Upgrade:**
```
POST   /api/companies/upgrade
  Body: {companyName, nip, address, contactEmail, phone?}
  Returns: {companyProfile, viesStatus}
```

**Company Profile:**
```
GET    /api/companies/:slug
PATCH  /api/companies/:slug (owner or admin only)
POST   /api/companies/:slug/logo
POST   /api/companies/:slug/banner
```

**Categories:**
```
GET    /api/categories (public, hierarchical tree)
GET    /api/categories/:id
POST   /api/admin/categories (admin only)
PATCH  /api/admin/categories/:id (admin only)
DELETE /api/admin/categories/:id (admin only)
PATCH  /api/admin/categories/reorder (admin only, bulk update order)
```

**Admin - Companies:**
```
GET    /api/admin/companies (list, filters, search)
GET    /api/admin/companies/:id
PATCH  /api/admin/companies/:id/verify
PATCH  /api/admin/companies/:id/reject
DELETE /api/admin/companies/:id (soft delete)
```

**Admin - Users:**
```
GET    /api/admin/users (list, filters, search)
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role
PATCH  /api/admin/users/:id/ban
DELETE /api/admin/users/:id
```

**VIES Integration:**
```
POST   /api/internal/vies/check
  Body: {nip}
  Returns: {valid: boolean, name, address}
```

### 5.3 VIES API Client

```typescript
// src/lib/vies.ts
import soap from 'soap';

interface VIESResponse {
  valid: boolean;
  name: string;
  address: string;
  countryCode: string;
  vatNumber: string;
  requestDate: Date;
}

export async function checkVAT(
  countryCode: string,
  vatNumber: string
): Promise<VIESResponse> {
  const VIES_URL = 'http://ec.europa.eu/taxation_customs/vies/services/checkVatService';

  try {
    const client = await soap.createClientAsync(VIES_URL);
    const result = await client.checkVatAsync({
      countryCode,
      vatNumber,
    });

    return {
      valid: result[0].valid,
      name: result[0].name,
      address: result[0].address,
      countryCode,
      vatNumber,
      requestDate: result[0].requestDate,
    };
  } catch (error) {
    console.error('VIES API error:', error);
    throw new Error('VIES_API_UNAVAILABLE');
  }
}
```

### 5.4 Background Jobs (Inngest)

```typescript
// Re-verification cron job
inngest.createFunction(
  { name: 'companies.reverify' },
  { cron: '0 2 * * 0' }, // Sunday 2 AM
  async () => {
    const companies = await prisma.companyProfile.findMany({
      where: {
        verifiedAt: {
          lte: subMonths(new Date(), 6),
        },
        viesVerified: true,
      },
    });

    for (const company of companies) {
      await inngest.send({
        name: 'company.vies.check',
        data: { companyId: company.id },
      });
    }
  }
);
```

### 5.5 UI Components

**New components:**
- CompanyProfileCard (preview na public profile)
- CompanyForm (edit form w dashboard)
- CategoryPicker (hierarchical dropdown)
- ImageUploader (logo, banner with crop)
- MarkdownEditor (description z preview)
- BusinessHoursPicker (time inputs dla każdego dnia)

**Admin components:**
- AdminLayout (sidebar navigation)
- DataTable (reusable table z sortowaniem, filtrowaniem)
- CategoryTreeView (hierarchical drag & drop)
- AuditLogViewer (history adminów actions)

### 5.6 Pages & Routes

```
/companies/:slug              # Public company profile
/dashboard                    # Company dashboard (home)
/dashboard/settings           # Edit company profile
/settings/upgrade             # Upgrade to company form

/admin                        # Admin dashboard
/admin/companies              # Companies list + verification
/admin/categories             # Category management
/admin/users                  # Users list
/admin/audit                  # Audit log viewer
```

---

## 6. Kryteria Akceptacji (Etap jako całość)

### Funkcjonalne:
- [ ] User może upgrade'ować do Company account
- [ ] VIES API verification działa (automatyczna weryfikacja NIP)
- [ ] Fallback do manual verification gdy VIES down
- [ ] Firma może utworzyć i edytować profil (logo, banner, opis, kategoria, location)
- [ ] Publiczny profil firmy widoczny pod `/companies/[slug]`
- [ ] System kategorii działa (hierarchia, ikony)
- [ ] Admin może zarządzać kategoriami (CRUD)
- [ ] Admin może manualnie weryfikować firmy
- [ ] Admin może przeglądać listę firm i użytkowników
- [ ] Audit log zapisuje wszystkie akcje adminów

### Niefunkcjonalne:
- [ ] VIES check < 5s (p95)
- [ ] Company profile load < 2s (LCP)
- [ ] Image upload (logo/banner) < 5s
- [ ] Admin panel responsive (mobile, tablet, desktop)
- [ ] Public profiles SEO-optimized (meta tags, structured data)

### Bezpieczeństwo:
- [ ] Tylko zweryfikowane firmy mogą publikować shorty (etap 3)
- [ ] NIP unique constraint w DB
- [ ] Admin endpoints authorization (role check)
- [ ] Image upload validation (file type, size)
- [ ] VIES API rate limiting (defensive)

### Integracje:
- [ ] VIES API integration działa
- [ ] Cloudflare R2 upload dla logo/banner
- [ ] Mapbox autocomplete dla location
- [ ] Email notifications (verification success/fail)

---

## 7. Out of Scope (Nie w tym etapie)

- ❌ Upload shortsów (Etap 3)
- ❌ Dashboard analytics (Etap 7)
- ❌ Follow companies (Etap 5)
- ❌ Moderacja shortsów/komentarzy (Etap 6)
- ❌ Full admin moderation queue (Etap 6)
- ❌ Company tiers/subscriptions (Post-MVP)
- ❌ Non-EU company verification (Post-MVP)

---

## 8. Zależności

### External Services:
- **VIES API:** EU VAT validation (public, no credentials needed)
- **Cloudflare R2:** Logo & banner storage (bucket: `videoshorts-companies`)
- **Mapbox:** Location autocomplete, geocoding
- **Resend:** Email notifications (verification status)

### Prerequisites:
- Etap 1 ukończony (User auth, profiles, layout)
- R2 bucket configured dla company images
- Mapbox token configured
- Admin user created w database (seed script)

---

## 9. Ryzyka i Mitygacje

### Ryzyko 1: VIES API Unstable (EU public service)
**Prawdopodobieństwo:** Wysokie
**Wpływ:** Średni
**Mitygacja:**
- Fallback do manual admin verification
- Cache VIES results (6 months)
- Retry logic (3 attempts, exponential backoff)
- Clear messaging: "Verification in progress, will notify by email"
- Admin dashboard pokazuje pending verifications

### Ryzyko 2: Duplicate Company Names (Slug Conflicts)
**Prawdopodobieństwo:** Średnie
**Wpływ:** Niski
**Mitygacja:**
- Auto-generate unique slug (append number if conflict: `kowalska-cukiernia-2`)
- Display conflict warning w UI
- Allow manual slug override (with uniqueness check)

### Ryzyko 3: Category Management Complexity
**Prawdopodobieństwo:** Niskie
**Wpływ:** Niski
**Mitygacja:**
- Start z flat list (10-15 categories)
- Hierarchia (2 levels max) added later if needed
- Seed script z pre-defined categories
- Clear UX: drag & drop dla reordering

### Ryzyko 4: Image Upload Performance
**Prawdopodobieństwo:** Niskie
**Wpływ:** Średni
**Mitygacja:**
- Client-side image compression (browser-image-compression)
- Direct upload do R2 (presigned URLs)
- Progress indicator
- Retry mechanism

---

## 10. Metryki Sukcesu (Ten Etap)

### Technical Metrics:
- VIES API success rate > 80% (z fallback)
- Company profile creation time < 2 min (user perspective)
- Admin verification time < 5 min (manual review)
- Image upload success rate > 95%

### Business Metrics (Post-Launch):
- Company signup rate: > 20% z registered users
- Profile completion rate: > 80% (wszystkie pola wypełnione)
- VIES auto-verification rate: > 70%

---

## 11. Harmonogram (Przykładowy)

### Tydzień 1: Company Upgrade + VIES
- **Dni 1-2:** Database schema, VIES client, upgrade flow
- **Dni 3-4:** Public company profile, SEO optimization
- **Dzień 5:** Image uploads (logo, banner, R2 integration)

### Tydzień 2: Categories + Admin Panel
- **Dni 1-2:** Category system (CRUD, seed data)
- **Dni 3-4:** Admin panel (layout, companies management, users list)
- **Dzień 5:** Testing, polish, documentation

---

## 12. Historia Zmian

| Data | Wersja | Autor | Zmiany |
|------|--------|-------|--------|
| 2025-11-28 | 1.0 | AI Stage Planner | Initial specification |

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
**Status:** ✅ Ready for Export to AI Spec Flow
