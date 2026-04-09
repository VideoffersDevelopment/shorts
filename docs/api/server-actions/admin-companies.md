# Admin Companies Server Actions

Server Actions dla administracyjnego zarządzania firmami.

**Lokalizacja:** `src/app/actions/admin/companies/`
**Wymagane uprawnienia:** ADMIN
**Namespace:** admin/companies

---

## Przegląd

| Action | Plik | Opis |
|--------|------|------|
| `listCompanies` | `list.ts` | Lista firm z filtrowaniem i paginacją |
| `updateCompanyStatus` | `update-status.ts` | Zmiana statusu firmy + audit log |

---

## listCompanies

Pobiera paginowaną listę firm z możliwością filtrowania i wyszukiwania.

### Sygnatura

```typescript
async function listCompanies(
  params: ListCompaniesInput
): Promise<ActionResult<{
  companies: CompanyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>>
```

### Input Schema

```typescript
const listSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  filter: z.enum(['all', 'verified', 'unverified']).default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'companyName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
```

### Parametry

| Pole | Typ | Default | Opis |
|------|-----|---------|------|
| `page` | number | 1 | Numer strony |
| `limit` | number | 20 | Liczba wyników per page (max 100) |
| `filter` | enum | 'all' | Filtr weryfikacji VIES |
| `search` | string | - | Wyszukiwanie (companyName, NIP, email) |
| `sortBy` | enum | 'createdAt' | Pole sortowania |
| `sortOrder` | enum | 'desc' | Kierunek sortowania |

### Filter Values

| Value | Opis | WHERE Clause |
|-------|------|--------------|
| `all` | Wszystkie firmy | - |
| `verified` | Tylko zweryfikowane | `viesVerified = true` |
| `unverified` | Tylko niezweryfikowane | `viesVerified = false` |

### Returns

```typescript
{
  success: true,
  data: {
    companies: [
      {
        id: "comp_123",
        companyName: "Example Sp. z o.o.",
        nip: "1234567890",
        viesVerified: true,
        email: "contact@example.com",
        categoryName: "Gastronomia",
        createdAt: "2025-12-15T10:00:00Z",
        user: {
          email: "owner@example.com"
        }
      }
    ],
    total: 45,
    page: 1,
    limit: 20,
    totalPages: 3
  }
}
```

### Przykład

```typescript
import { listCompanies } from '@/app/actions/admin/companies/list';

// Podstawowe użycie
const result = await listCompanies({
  page: 1,
  limit: 20
});

// Z filtrowaniem i wyszukiwaniem
const filtered = await listCompanies({
  page: 1,
  limit: 20,
  filter: 'verified',
  search: 'restaurant',
  sortBy: 'companyName',
  sortOrder: 'asc'
});

if (filtered.success) {
  const { companies, total, totalPages } = filtered.data;
  // Render table...
}
```

### Search Implementation

**Full-text search w polach:**
- companyName (ILIKE %query%)
- nip (ILIKE %query%)
- email (ILIKE %query%)

**Zapytanie Prisma:**

```typescript
const where: Prisma.CompanyProfileWhereInput = {
  OR: search ? [
    { companyName: { contains: search, mode: 'insensitive' } },
    { nip: { contains: search } },
    { email: { contains: search, mode: 'insensitive' } }
  ] : undefined,
  viesVerified: filter === 'verified' ? true : filter === 'unverified' ? false : undefined
};
```

---

## updateCompanyStatus

Zmienia status firmy (ACTIVE ↔ SUSPENDED) i tworzy audit log.

**UWAGA:** Aktualnie CompanyProfile nie ma kolumny `status`. To pole jest planowane w przyszłości. Obecnie action istnieje jako placeholder.

### Sygnatura

```typescript
async function updateCompanyStatus(
  data: UpdateStatusInput
): Promise<ActionResult<{ company: CompanyProfile }>>
```

### Input Schema

```typescript
const updateStatusSchema = z.object({
  companyId: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});
```

### Parametry

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `companyId` | string | ✅ | ID firmy |
| `status` | enum | ✅ | Nowy status (ACTIVE, SUSPENDED) |

### Returns

```typescript
{
  success: true,
  data: {
    company: { /* updated profile */ }
  }
}
```

### Błędy

| Code | Message | Przyczyna |
|------|---------|-----------|
| `UNAUTHORIZED` | Not authenticated | Brak sesji |
| `FORBIDDEN` | Admin role required | user.role !== 'ADMIN' |
| `NOT_FOUND` | Company not found | companyId nie istnieje |

### Audit Log

**Automatyczne tworzenie audit log entry:**

```typescript
await prisma.auditLog.create({
  data: {
    adminId: session.user.id,
    action: 'UPDATE_COMPANY_STATUS',
    targetType: 'COMPANY',
    targetId: companyId,
    metadata: {
      previousStatus: 'ACTIVE',
      newStatus: 'SUSPENDED',
      reason: 'Policy violation' // opcjonalne
    }
  }
});
```

### Przykład

```typescript
import { updateCompanyStatus } from '@/app/actions/admin/companies/update-status';

// Zawieszenie firmy
const result = await updateCompanyStatus({
  companyId: "comp_123",
  status: "SUSPENDED"
});

if (result.success) {
  toast.success('Firma zawieszona');
  // Audit log automatycznie utworzony
} else {
  toast.error(result.error);
}

// Aktywacja firmy
await updateCompanyStatus({
  companyId: "comp_123",
  status: "ACTIVE"
});
```

---

## Autoryzacja

**Wszystkie admin actions wymagają:**

```typescript
const session = await auth();

if (!session?.user) {
  return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
}

if (session.user.role !== 'ADMIN') {
  return { success: false, error: 'Admin role required', code: 'FORBIDDEN' };
}
```

---

## Testy

**Lokalizacja:** `src/app/actions/admin/companies/__tests__/`

**Test Suites:** 2 (list.test.ts, update-status.test.ts)

**Total Tests:** 74

**Coverage:** ~97%

### Test Scenarios

**list.test.ts:**
- ✅ Successful list (all companies)
- ✅ Pagination (multiple pages)
- ✅ Filter: verified only
- ✅ Filter: unverified only
- ✅ Search by companyName
- ✅ Search by NIP
- ✅ Sort by companyName ASC
- ✅ Sort by createdAt DESC
- ✅ Unauthorized (no session)
- ✅ Forbidden (not admin)

**update-status.test.ts:**
- ✅ Successful status update (ACTIVE → SUSPENDED)
- ✅ Successful status update (SUSPENDED → ACTIVE)
- ✅ Audit log creation
- ✅ Company not found
- ✅ Unauthorized
- ✅ Forbidden (not admin)

---

## Powiązana Dokumentacja

- [Admin Panel Feature](../../features/admin/README.md)
- [CompaniesTable Component](../../components/admin/companies-table.md)
- [AuditLog Model](../../database/models/audit-log.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
