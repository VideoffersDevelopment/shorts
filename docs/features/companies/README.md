# Funkcjonalności Firmowe

**Status:** ✅ Zaimplementowane (Stage 02)
**Moduł:** Companies
**Data wdrożenia:** 2025-12-14 → 2025-12-16

---

## Przegląd

Moduł Companies umożliwia użytkownikom upgrade konta USER → COMPANY, weryfikację VAT przez VIES, tworzenie publicznych profili firmowych oraz zarządzanie informacjami o firmie.

### Główne Funkcjonalności

1. **Upgrade Konta** - Zmiana typu konta z USER na COMPANY
2. **Weryfikacja VIES** - Automatyczna weryfikacja numeru VAT przez system VIES UE
3. **Profil Publiczny** - Strona firmowa dostępna pod `/firma/[slug]`
4. **Edycja Profilu** - Zarządzanie danymi firmy, logo, banerem, kategoriami
5. **Geolokalizacja** - Wsparcie dla lokalizacji firmy z integracją Mapbox
6. **Kategorie** - Hierarchiczny system kategorii i subkategorii
7. **Godziny Otwarcia** - Wizualny edytor godzin pracy (7 dni)

---

## User Stories

### US-1: Upgrade do Konta Firmowego
**Jako** zarejestrowany użytkownik
**Chcę** zmienić moje konto na konto firmowe
**Aby** móc publikować treści jako firma

**Akceptacja:**
- ✅ Użytkownik widzi przycisk "Przejdź na konto firmowe" w panelu
- ✅ Formularz wymaga: NIP, nazwa firmy
- ✅ System weryfikuje NIP przez VIES API
- ✅ Po weryfikacji konto zmienia się na COMPANY
- ✅ Użytkownik otrzymuje email potwierdzający

### US-2: Publiczny Profil Firmowy
**Jako** właściciel firmy
**Chcę** mieć publiczną stronę mojej firmy
**Aby** klienci mogli znaleźć informacje o mojej działalności

**Akceptacja:**
- ✅ Profil dostępny pod `/firma/[slug]`
- ✅ Wyświetla: logo, banner, opis, kategorie, dane kontaktowe
- ✅ Pokazuje godziny otwarcia i lokalizację na mapie
- ✅ SEO-friendly (Open Graph, Twitter Card)
- ✅ Responsywny design

### US-3: Edycja Profilu Firmowego
**Jako** właściciel firmy
**Chcę** edytować informacje o mojej firmie
**Aby** utrzymać aktualne dane

**Akceptacja:**
- ✅ Edycja dostępna w `/panel/firma/edit`
- ✅ Upload logo (1:1, max 2MB) z cropping
- ✅ Upload banner (16:9, max 5MB) z cropping
- ✅ Edycja opisu (Markdown preview)
- ✅ Wybór głównej kategorii + max 3 subkategorie
- ✅ Ustawienie godzin otwarcia (7-day picker)
- ✅ Dane kontaktowe: website, telefon, email, social media
- ✅ Real-time walidacja

---

## Przepływ Użytkownika

### 1. Upgrade Flow

```
Panel Użytkownika
    ↓
Kliknięcie "Przejdź na konto firmowe"
    ↓
Formularz upgrade:
  - Nazwa firmy
  - NIP
    ↓
Weryfikacja VIES (loading state)
    ↓
[SUKCES] → Redirect do /panel/firma/edit
[BŁĄD] → Komunikat o błędzie + retry
```

### 2. Edycja Profilu Flow

```
/panel/firma/edit
    ↓
Wypełnienie formularza:
  1. Logo & Banner (upload)
  2. Podstawowe dane
  3. Kategoria główna
  4. Subkategorie (max 3)
  5. Godziny otwarcia
  6. Dane kontaktowe
  7. Social media
    ↓
Walidacja (client + server)
    ↓
Zapisanie → Redirect do /firma/[slug]
```

---

## Komponenty

| Komponent | Ścieżka | Opis |
|-----------|---------|------|
| `UpgradeForm` | `src/components/companies/upgrade-form.tsx` | Formularz upgrade'u USER → COMPANY |
| `CompanyProfileDisplay` | `src/components/companies/company-profile-display.tsx` | Publiczny widok profilu |
| `CompanyProfileEditForm` | `src/components/companies/company-profile-edit-form.tsx` | Edycja profilu |
| `SubcategoryPicker` | `src/components/companies/subcategory-picker.tsx` | Multi-select subkategorii |
| `BusinessHoursPicker` | `src/components/companies/business-hours-picker.tsx` | Edytor godzin otwarcia |
| `LogoUpload` | `src/components/companies/logo-upload.tsx` | Upload logo z cropping |
| `BannerUpload` | `src/components/companies/banner-upload.tsx` | Upload banner z cropping |
| `ViesStatusBadge` | `src/components/companies/vies-status-badge.tsx` | Badge weryfikacji VIES |

---

## Server Actions

| Action | Ścieżka | Opis |
|--------|---------|------|
| `upgrade` | `src/app/actions/companies/upgrade.ts` | Upgrade USER → COMPANY |
| `update` | `src/app/actions/companies/update.ts` | Aktualizacja profilu |
| `uploadLogo` | `src/app/actions/companies/upload-logo.ts` | Upload logo do R2 |
| `uploadBanner` | `src/app/actions/companies/upload-banner.ts` | Upload banner do R2 |

Szczegółowa dokumentacja: [API Reference](../../api/server-actions/companies.md)

---

## Routing

| Route | Plik | Typ | Opis |
|-------|------|-----|------|
| `/firma/[slug]` | `src/app/(main)/[locale]/firma/[slug]/page.tsx` | Public | Publiczny profil firmy |
| `/panel/firma` | `src/app/(main)/[locale]/panel/firma/page.tsx` | Protected | Dashboard firmy |
| `/panel/firma/edit` | `src/app/(main)/[locale]/panel/firma/edit/page.tsx` | Protected | Edycja profilu |

---

## Modele Bazy Danych

### CompanyProfile

```prisma
model CompanyProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  companyName     String
  nip             String    @unique
  viesVerified    Boolean   @default(false)
  verifiedAt      DateTime?
  logo            String?
  banner          String?
  description     String?   @db.Text
  categoryId      String?
  subcategoryIds  String[]  // max 3
  website         String?
  phone           String?
  email           String?
  socialLinks     Json?
  businessHours   Json?
  latitude        Float?
  longitude       Float?
  address         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

Szczegółowa dokumentacja: [Database Models](../../database/models/company-profile.md)

---

## Walidacja

### NIP Validation

```typescript
// Format: 10 cyfr
const NIP_REGEX = /^[0-9]{10}$/;

// Weryfikacja przez VIES API
const result = await verifyVAT(nip);
if (!result.valid) {
  throw new Error("NIP nie został zweryfikowany w systemie VIES");
}
```

### Upload Validation

**Logo:**
- Format: JPG, PNG, WEBP
- Aspect ratio: 1:1
- Max rozmiar: 2MB
- Wymiary: min 200x200px, max 2000x2000px

**Banner:**
- Format: JPG, PNG, WEBP
- Aspect ratio: 16:9
- Max rozmiar: 5MB
- Wymiary: min 800x450px, max 3840x2160px

### Business Hours Validation

```typescript
// Format JSON:
{
  "monday": { "open": "09:00", "close": "17:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
  // ... pozostałe dni
  "sunday": { "closed": true }
}

// Walidacja:
- HH:MM format (00:00 - 23:59)
- open < close
- closed = true → open/close ignorowane
```

---

## Przykłady Użycia

### 1. Upgrade do Konta Firmowego

```typescript
import { upgrade } from '@/app/actions/companies/upgrade';

const result = await upgrade({
  companyName: "Example Sp. z o.o.",
  nip: "1234567890"
});

if (result.success) {
  // Redirect do edycji profilu
  router.push('/panel/firma/edit');
} else {
  // Obsługa błędu
  toast.error(result.error);
}
```

### 2. Aktualizacja Profilu

```typescript
import { update } from '@/app/actions/companies/update';

const result = await update({
  description: "Nasza firma zajmuje się...",
  categoryId: "cat_123",
  subcategoryIds: ["sub_1", "sub_2"],
  website: "https://example.com",
  businessHours: {
    monday: { open: "08:00", close: "16:00", closed: false },
    // ...
  }
});
```

### 3. Upload Logo

```typescript
import { uploadLogo } from '@/app/actions/companies/upload-logo';

// Krok 1: Pobierz presigned URL
const urlResult = await uploadLogo({ filename: "logo.png" });

// Krok 2: Upload do R2
await fetch(urlResult.data.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});

// Krok 3: Automatyczne zapisanie w CompanyProfile
// (dzieje się po stronie serwera)
```

---

## Integracje

### VIES API

**Cel:** Weryfikacja numerów VAT w systemie UE

**Endpoint:** `https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl`

**Implementacja:** `src/lib/vies.ts`

**Rate Limiting:** 10 zapytań/minutę per user

**Timeout:** 10 sekund

**Retry Policy:** 3 próby z exponential backoff (1s, 2s, 4s)

Szczegóły: [VIES Integration Guide](./vies-integration.md)

### Cloudflare R2

**Cel:** Przechowywanie logo i banner

**Bucket:** `videoshorts-company-assets`

**Pattern:** `companies/{userId}/logo.{ext}`, `companies/{userId}/banner.{ext}`

**CDN:** Automatic via R2 public URL

**Cleanup:** Automatyczne usuwanie starych plików przy nowym upload

---

## Tłumaczenia

**Namespace:** `companies`

**Języki:** pl (pełne), en, de, es, ru (maszynowe)

**Klucze:** 87 (upgrade, profile, validation)

**Plik:** `messages/[locale]/companies.json`

### Przykład

```json
{
  "upgrade": {
    "title": "Przejdź na konto firmowe",
    "nip": "NIP",
    "companyName": "Nazwa firmy",
    "viesVerifying": "Weryfikacja w VIES...",
    "viesSuccess": "Firma zweryfikowana ✓",
    "viesError": "Nie można zweryfikować NIP"
  },
  "profile": {
    "edit": "Edytuj profil firmy",
    "logoUpload": "Dodaj logo",
    "bannerUpload": "Dodaj banner"
  }
}
```

---

## Testy

**Test Suites:** 6 (task-02, task-03, task-04, task-05, task-11, task-12)

**Total Tests:** 468

**Coverage:** ~95%

### Test Scenarios

- ✅ Upgrade flow (happy path + error cases)
- ✅ VIES verification (success, timeout, invalid NIP)
- ✅ Profile display (public page rendering)
- ✅ Profile edit (form validation, upload)
- ✅ SubcategoryPicker (selection, max 3 limit)
- ✅ BusinessHoursPicker (time validation, closed days)

---

## Problemy i Rozwiązania

### Problem 1: VIES API Timeouts

**Issue:** VIES API często nie odpowiada w rozsądnym czasie (>30s)

**Rozwiązanie:**
- Timeout: 10s
- Retry: 3x z exponential backoff
- Fallback: Manual verification (admin approve)

### Problem 2: R2 CORS dla Local Development

**Issue:** CORS errors podczas upload z localhost:3000

**Rozwiązanie:**
```json
// R2 CORS Configuration
{
  "AllowedOrigins": ["http://localhost:3000", "https://videoshorts.pl"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["*"]
}
```

### Problem 3: Subcategory Selection UX

**Issue:** Database field istniał, brak UI (task-11)

**Rozwiązanie:** SubcategoryPicker component z multi-select dropdown

---

## Roadmap

### ✅ Completed (Stage 02)

- Upgrade flow
- VIES verification
- Public profiles
- Profile edit
- Category system
- Business hours picker

### 🔜 Planned (Future Stages)

- **Stage 03:** Payment integration (Przelewy24)
- **Stage 04:** Video shorts publishing dla firm
- **Stage 05:** Analytics dashboard
- **Stage 06:** Review system

---

## Powiązana Dokumentacja

- [Admin Companies Management](../admin/companies.md)
- [API Reference - Companies](../../api/server-actions/companies.md)
- [Components - Companies](../../components/companies/README.md)
- [Database - CompanyProfile](../../database/models/company-profile.md)
- [VIES Integration](./vies-integration.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
**Generator:** exec-doc-generator (AI Spec Flow)
