# Companies Server Actions

Server Actions dla zarządzania profilami firmowymi.

**Lokalizacja:** `src/app/actions/companies/`
**Moduł:** Companies
**Wymagane uprawnienia:** USER (dla upgrade), COMPANY (dla pozostałych)

---

## Przegląd

| Action | Plik | Autoryzacja | Opis |
|--------|------|-------------|------|
| `upgrade` | `upgrade.ts` | USER | Upgrade USER → COMPANY |
| `update` | `update.ts` | COMPANY | Aktualizacja profilu firmowego |
| `uploadLogo` | `upload-logo.ts` | COMPANY | Upload logo do R2 |
| `uploadBanner` | `upload-banner.ts` | COMPANY | Upload banner do R2 |

---

## upgrade

Konwertuje konto użytkownika z roli USER na COMPANY z weryfikacją VIES.

### Sygnatura

```typescript
async function upgrade(
  data: UpgradeInput
): Promise<ActionResult<{ companyProfile: CompanyProfile }>>
```

### Input Schema (Zod)

```typescript
const upgradeSchema = z.object({
  companyName: z.string().min(3).max(100),
  nip: z.string().regex(/^[0-9]{10}$/, "NIP musi mieć 10 cyfr")
});

type UpgradeInput = z.infer<typeof upgradeSchema>;
```

### Parametry

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `companyName` | string | ✅ | Nazwa firmy (3-100 znaków) |
| `nip` | string | ✅ | Numer NIP (10 cyfr) |

### Returns

**Success:**
```typescript
{
  success: true,
  data: {
    companyProfile: {
      id: "comp_123",
      userId: "user_456",
      companyName: "Example Sp. z o.o.",
      nip: "1234567890",
      viesVerified: true,
      verifiedAt: "2025-12-15T10:30:00Z",
      // ... rest of profile
    }
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: string,
  code?: "UNAUTHORIZED" | "ALREADY_COMPANY" | "NIP_EXISTS" | "VIES_FAILED"
}
```

### Błędy

| Code | Message | Przyczyna |
|------|---------|-----------|
| `UNAUTHORIZED` | Not authenticated | Brak sesji |
| `ALREADY_COMPANY` | User is already a company | Użytkownik ma już rolę COMPANY |
| `NIP_EXISTS` | NIP already registered | NIP już istnieje w bazie |
| `VIES_FAILED` | VIES verification failed | VIES API nie zweryfikował NIP |

### Proces

1. Sprawdzenie autoryzacji (sesja musi istnieć)
2. Sprawdzenie czy user.role === 'USER'
3. Walidacja input (Zod schema)
4. Weryfikacja NIP przez VIES API
5. Sprawdzenie unikalności NIP w bazie
6. Transakcja DB:
   - Utworzenie CompanyProfile
   - Update User.role → 'COMPANY'
7. Return profile

### Przykład

```typescript
'use client';

import { upgrade } from '@/app/actions/companies/upgrade';
import { useTranslations } from 'next-intl';

export function UpgradeForm() {
  const t = useTranslations('companies.upgrade');

  const handleSubmit = async (formData: FormData) => {
    const result = await upgrade({
      companyName: formData.get('companyName') as string,
      nip: formData.get('nip') as string
    });

    if (result.success) {
      toast.success(t('success'));
      router.push('/panel/firma/edit');
    } else {
      if (result.code === 'VIES_FAILED') {
        toast.error(t('viesError'));
      } else {
        toast.error(result.error);
      }
    }
  };

  return (
    <form action={handleSubmit}>
      <input name="companyName" required />
      <input name="nip" pattern="[0-9]{10}" required />
      <button type="submit">{t('submit')}</button>
    </form>
  );
}
```

### VIES Integration

**Wywołanie:**
```typescript
import { verifyVAT } from '@/lib/vies';

const viesResult = await verifyVAT(nip);
// { valid: boolean, companyName?: string, address?: string }
```

**Timeout:** 10 sekund

**Retry Policy:** 3 próby z exponential backoff (1s, 2s, 4s)

**Fallback:** Jeśli VIES API nie odpowiada, upgrade jest odrzucany (manual verification przez admina w przyszłości)

---

## update

Aktualizuje dane profilu firmowego.

### Sygnatura

```typescript
async function update(
  data: UpdateCompanyInput
): Promise<ActionResult<{ companyProfile: CompanyProfile }>>
```

### Input Schema (Zod)

```typescript
const updateSchema = z.object({
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  subcategoryIds: z.array(z.string()).max(3).optional(),
  website: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional()
  }).optional(),
  businessHours: z.record(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    z.object({
      open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      closed: z.boolean()
    })
  ).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(200).optional()
});
```

### Parametry

| Pole | Typ | Wymagane | Walidacja |
|------|-----|----------|-----------|
| `description` | string | ❌ | Max 5000 znaków (Markdown) |
| `categoryId` | string | ❌ | Musi istnieć w DB |
| `subcategoryIds` | string[] | ❌ | Max 3 elementy |
| `website` | string | ❌ | Valid URL (auto-adds https://) |
| `phone` | string | ❌ | Max 20 znaków |
| `email` | string | ❌ | Valid email |
| `socialLinks` | object | ❌ | Valid URLs |
| `businessHours` | object | ❌ | HH:MM format, open < close |
| `latitude` | number | ❌ | -90 do 90 |
| `longitude` | number | ❌ | -180 do 180 |
| `address` | string | ❌ | Max 200 znaków |

### Returns

**Success:**
```typescript
{
  success: true,
  data: {
    companyProfile: { /* updated profile */ }
  }
}
```

### Błędy

| Code | Message | Przyczyna |
|------|---------|-----------|
| `UNAUTHORIZED` | Not authenticated | Brak sesji |
| `FORBIDDEN` | Not a company | user.role !== 'COMPANY' |
| `NOT_FOUND` | Company profile not found | Brak CompanyProfile dla user |
| `INVALID_CATEGORY` | Category not found | categoryId nie istnieje |

### Przykład

```typescript
import { update } from '@/app/actions/companies/update';

const result = await update({
  description: "# O nas\n\nNasza firma...",
  categoryId: "cat_gastronomia",
  subcategoryIds: ["cat_restauracje", "cat_catering"],
  website: "example.com", // Auto-converts to https://example.com
  businessHours: {
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    // ...
    sunday: { closed: true }
  }
});
```

### URL Sanitization

**Automatyczne dodawanie https://**

```typescript
// Input: "example.com"
// Output: "https://example.com"

// Input: "http://example.com"
// Output: "https://example.com" (upgrade to https)

// Input: "javascript:alert(1)"
// Error: Invalid URL (blokada dangerous schemes)
```

**Implementacja:** `src/lib/utils/url.ts`

---

## uploadLogo

Generuje presigned URL do upload logo firmy do Cloudflare R2.

### Sygnatura

```typescript
async function uploadLogo(
  data: UploadLogoInput
): Promise<ActionResult<{ uploadUrl: string; publicUrl: string }>>
```

### Input Schema

```typescript
const uploadLogoSchema = z.object({
  filename: z.string().regex(/\.(jpg|jpeg|png|webp)$/i)
});
```

### Parametry

| Pole | Typ | Wymagane | Walidacja |
|------|-----|----------|-----------|
| `filename` | string | ✅ | Rozszerzenie: .jpg, .jpeg, .png, .webp |

### Returns

```typescript
{
  success: true,
  data: {
    uploadUrl: "https://r2.cloudflare.com/...", // Presigned PUT URL (1h TTL)
    publicUrl: "https://cdn.videoshorts.pl/companies/user_123/logo.png"
  }
}
```

### Upload Process

**Krok 1: Pobierz presigned URL**

```typescript
const result = await uploadLogo({ filename: "logo.png" });
const { uploadUrl, publicUrl } = result.data;
```

**Krok 2: Upload pliku do R2**

```typescript
const file = new File([blob], "logo.png", { type: "image/png" });

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});
```

**Krok 3: Automatyczny update CompanyProfile**

```typescript
// Server automatycznie zapisuje publicUrl w CompanyProfile.logo
// Po wykryciu successful upload (webhook lub polling)
```

### Constraints

- **Aspect Ratio:** 1:1 (Square)
- **Max File Size:** 2MB
- **Min Dimensions:** 200x200px
- **Max Dimensions:** 2000x2000px
- **Formats:** JPG, PNG, WEBP

### R2 Path Pattern

```
companies/{userId}/logo.{ext}
```

**Cleanup:** Stare logo automatycznie usuwane przy nowym upload.

---

## uploadBanner

Generuje presigned URL do upload banner firmy do Cloudflare R2.

### Sygnatura

```typescript
async function uploadBanner(
  data: UploadBannerInput
): Promise<ActionResult<{ uploadUrl: string; publicUrl: string }>>
```

### Input Schema

```typescript
const uploadBannerSchema = z.object({
  filename: z.string().regex(/\.(jpg|jpeg|png|webp)$/i)
});
```

### Returns

Analogicznie do `uploadLogo`

### Constraints

- **Aspect Ratio:** 16:9 (Landscape)
- **Max File Size:** 5MB
- **Min Dimensions:** 800x450px
- **Max Dimensions:** 3840x2160px (4K)
- **Formats:** JPG, PNG, WEBP

### R2 Path Pattern

```
companies/{userId}/banner.{ext}
```

---

## Wspólne Wzorce

### ActionResult Type

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### Error Handling

**Wszystkie actions:**

```typescript
try {
  // Walidacja
  const validated = schema.parse(data);

  // Autoryzacja
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
  }

  // Business logic
  const result = await performAction(validated);

  return { success: true, data: result };
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: error.errors[0].message };
  }
  return { success: false, error: 'Internal server error' };
}
```

### Session Management

```typescript
import { auth } from '@/auth';

const session = await auth();
const userId = session?.user?.id;
const userRole = session?.user?.role;
```

---

## Testy

**Lokalizacja:** `src/app/actions/companies/__tests__/`

**Test Suites:** 4 (upgrade, update, upload-logo, upload-banner)

**Total Tests:** 68

**Coverage:** ~96%

### Test Scenarios

**upgrade.test.ts:**
- ✅ Successful upgrade with VIES verification
- ✅ Unauthorized (no session)
- ✅ Already company (role check)
- ✅ NIP already exists
- ✅ VIES verification failed
- ✅ Invalid input (Zod errors)

**update.test.ts:**
- ✅ Successful profile update (all fields)
- ✅ Partial update (only description)
- ✅ URL sanitization (website)
- ✅ Business hours validation
- ✅ Subcategories limit (max 3)
- ✅ Not a company (role check)
- ✅ Company profile not found

**upload-logo.test.ts:**
- ✅ Generate presigned URL
- ✅ Invalid filename extension
- ✅ Unauthorized

**upload-banner.test.ts:**
- ✅ Generate presigned URL
- ✅ Invalid filename extension
- ✅ Unauthorized

---

## Powiązana Dokumentacja

- [Companies Feature Guide](../../features/companies/README.md)
- [VIES Integration](../../features/companies/vies-integration.md)
- [CompanyProfile Model](../../database/models/company-profile.md)
- [R2 Upload Pattern](../../guides/r2-uploads.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
