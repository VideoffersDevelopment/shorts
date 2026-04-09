# Panel Administracyjny

**Status:** ✅ Zaimplementowany (Stage 02)
**Moduł:** Admin
**Wersja:** 1.0
**Data wdrożenia:** 2025-12-15 → 2025-12-16

---

## Przegląd

Panel administracyjny umożliwia użytkownikom z rolą ADMIN zarządzanie firmami, kategoriami oraz monitorowanie systemu. Panel jest dostępny pod adresem `/admin` i wymaga uprawnień administratora.

### Główne Funkcjonalności

1. **Zarządzanie Firmami** - Moderacja profili firmowych, zmiana statusów
2. **Zarządzanie Kategoriami** - CRUD kategorii i subkategorii, hierarchiczne drzewo
3. **Audit Log** - Śledzenie wszystkich akcji administracyjnych
4. **Dashboard** - Statystyki i metryki systemu (placeholder)

---

## Kontrola Dostępu

### Role-Based Access Control (RBAC)

**Wymagana rola:** `ADMIN`

**Middleware:** `src/middleware.ts`

```typescript
// Sprawdzenie roli w middleware
if (pathname.startsWith('/admin')) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/panel', request.url));
  }
}
```

### Admin Routes

| Route | Dostęp | Opis |
|-------|--------|------|
| `/admin` | ADMIN | Dashboard (statystyki) |
| `/admin/companies` | ADMIN | Zarządzanie firmami |
| `/admin/categories` | ADMIN | Zarządzanie kategoriami |

**Redirect:** Non-admin users → `/panel`

---

## Funkcjonalności

### 1. Zarządzanie Firmami

**Route:** `/admin/companies`

**Możliwości:**
- ✅ Lista wszystkich firm z paginacją (20 per page)
- ✅ Filtrowanie po statusie weryfikacji VIES
- ✅ Wyszukiwanie po nazwie, NIP, email
- ✅ Zmiana statusu firmy (ACTIVE ↔ SUSPENDED)
- ✅ Podgląd szczegółów firmy
- ✅ Link do publicznego profilu

#### Status Firmy

| Status | Opis | Akcje |
|--------|------|-------|
| `ACTIVE` | Firma aktywna, może publikować | Suspend |
| `SUSPENDED` | Firma zawieszona, brak publikacji | Activate |

**Uwaga:** Status nie jest zapisywany w CompanyProfile (brak kolumny `status`). Aktualnie używany tylko `viesVerified: boolean`.

#### Filtry i Wyszukiwanie

**Filtry:**
- Wszystkie firmy
- Tylko zweryfikowane (viesVerified = true)
- Tylko niezweryfikowane (viesVerified = false)

**Wyszukiwanie:** Full-text search w:
- companyName
- nip
- email

**Sortowanie:**
- Najnowsze (createdAt DESC)
- Alfabetycznie (companyName ASC)

#### Server Action: Update Status

```typescript
// src/app/actions/admin/companies/update-status.ts
const result = await updateCompanyStatus({
  companyId: "comp_123",
  status: "SUSPENDED"
});

// Automatycznie tworzy audit log:
// action: "UPDATE_COMPANY_STATUS"
// metadata: { previousStatus: "ACTIVE", newStatus: "SUSPENDED" }
```

Dokumentacja API: [Admin Companies Actions](../../api/server-actions/admin-companies.md)

---

### 2. Zarządzanie Kategoriami

**Route:** `/admin/categories`

**Możliwości:**
- ✅ Hierarchiczne drzewo kategorii (parent + children)
- ✅ Tworzenie kategorii głównych i subkategorii
- ✅ Edycja nazw (5 języków) i ikon
- ✅ Usuwanie kategorii (z walidacją)
- ✅ Zmiana kolejności (order field)

#### Struktura Kategorii

```
Kategoria Główna (parentId = null)
  ├── Subkategoria 1 (parentId = cat_main)
  ├── Subkategoria 2
  └── Subkategoria 3
```

**Ograniczenia:**
- Maksymalnie 2 poziomy (parent → child, brak child → grandchild)
- Unikalne slugi (auto-generated z name.pl)

#### Walidacja Usuwania

**Blokada usunięcia jeśli:**
- ❌ Kategoria ma przypisane firmy (categoryId w CompanyProfile)
- ❌ Kategoria ma subkategorie (children.length > 0)

**Komunikat:**
```
"Nie można usunąć kategorii, która ma przypisane firmy lub subkategorie"
```

#### Server Actions

| Action | Opis |
|--------|------|
| `createCategory` | Tworzenie kategorii/subkategorii |
| `updateCategory` | Aktualizacja nazw i ikony |
| `deleteCategory` | Usuwanie (z walidacją) |
| `listCategories` | Lista hierarchiczna |

Dokumentacja API: [Admin Categories Actions](../../api/server-actions/admin-categories.md)

---

### 3. Audit Log

**Cel:** Tracking wszystkich akcji administracyjnych dla compliance i debugging.

**Model:** `AuditLog`

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // "UPDATE_COMPANY_STATUS", "CREATE_CATEGORY", etc.
  targetType String   // "COMPANY", "CATEGORY"
  targetId   String
  metadata   Json?    // Dodatkowe dane (previous/new values)
  createdAt  DateTime @default(now())
}
```

#### Tracked Actions

| Action | Target Type | Metadata |
|--------|-------------|----------|
| `UPDATE_COMPANY_STATUS` | COMPANY | `{ previousStatus, newStatus }` |
| `CREATE_CATEGORY` | CATEGORY | `{ name, parentId }` |
| `UPDATE_CATEGORY` | CATEGORY | `{ previousName, newName }` |
| `DELETE_CATEGORY` | CATEGORY | `{ deletedName, deletedSlug }` |

**Automatyczne tworzenie:** Każda admin action tworzy audit log entry.

**UI:** Brak widoku audit log w Stage 02 (planned for future).

---

### 4. Dashboard (Placeholder)

**Route:** `/admin`

**Aktualny stan:** Placeholder z podstawowymi statystykami

**Planowane metryki:**
- Liczba firm (total, zweryfikowane, niezweryfikowane)
- Liczba kategorii
- Ostatnie akcje admin
- Liczba użytkowników

---

## Komponenty

### Layout & Navigation

| Komponent | Ścieżka | Opis |
|-----------|---------|------|
| `AdminLayout` | `src/components/admin/admin-layout.tsx` | Layout z sidebar |
| `AdminSidebar` | `src/components/admin/admin-sidebar.tsx` | Nawigacja (Dashboard, Companies, Categories) |

### Companies Management

| Komponent | Ścieżka | Opis |
|-----------|---------|------|
| `CompaniesTable` | `src/components/admin/companies-table.tsx` | Tabela firm z filtrowaniem |
| `CompanyStatusBadge` | `src/components/admin/company-status-badge.tsx` | Badge statusu (ACTIVE/SUSPENDED) |

### Categories Management

| Komponent | Ścieżka | Opis |
|-----------|---------|------|
| `CategoriesManager` | `src/components/admin/categories-manager.tsx` | Hierarchiczne drzewo |
| `CategoryFormDialog` | `src/components/admin/category-form-dialog.tsx` | Dialog CRUD kategorii |
| `CategoryTreeItem` | `src/components/admin/category-tree-item.tsx` | Rekurencyjny element drzewa |
| `DeleteCategoryDialog` | `src/components/admin/delete-category-dialog.tsx` | Potwierdzenie usunięcia |

Szczegóły: [Admin Components](../../components/admin/README.md)

---

## Przykłady Użycia

### 1. Zawieszenie Firmy

```typescript
import { updateCompanyStatus } from '@/app/actions/admin/companies/update-status';

// W CompaniesTable
const handleSuspend = async (companyId: string) => {
  const result = await updateCompanyStatus({
    companyId,
    status: 'SUSPENDED'
  });

  if (result.success) {
    toast.success('Firma zawieszona');
    // Refresh table
  } else {
    toast.error(result.error);
  }
};
```

### 2. Tworzenie Kategorii

```typescript
import { createCategory } from '@/app/actions/admin/categories/create';

const handleCreate = async () => {
  const result = await createCategory({
    name: {
      pl: "Gastronomia",
      en: "Food & Beverage",
      de: "Gastronomie",
      es: "Gastronomía",
      ru: "Гастрономия"
    },
    icon: "Utensils", // Lucide icon name
    parentId: null // Kategoria główna
  });
};
```

### 3. Tworzenie Subkategorii

```typescript
const result = await createCategory({
  name: {
    pl: "Restauracje",
    en: "Restaurants",
    // ...
  },
  icon: "ChefHat",
  parentId: "cat_gastronomia" // Parent category ID
});
```

### 4. Usuwanie Kategorii (z walidacją)

```typescript
import { deleteCategory } from '@/app/actions/admin/categories/delete';

const handleDelete = async (categoryId: string) => {
  const result = await deleteCategory({ categoryId });

  if (!result.success) {
    if (result.error.includes('firmy')) {
      toast.error('Kategoria ma przypisane firmy');
    } else if (result.error.includes('subkategorie')) {
      toast.error('Usuń najpierw subkategorie');
    }
  }
};
```

---

## UI/UX Patterns

### 1. Hierarchical Tree (Categories)

**Pattern:** Collapsible tree with recursive rendering

```typescript
// CategoryTreeItem.tsx
function CategoryTreeItem({ category, level = 0 }) {
  return (
    <Collapsible>
      <div style={{ marginLeft: level * 20 }}>
        {category.icon && <Icon name={category.icon} />}
        {category.name.pl}
      </div>
      {category.children?.map(child => (
        <CategoryTreeItem
          key={child.id}
          category={child}
          level={level + 1}
        />
      ))}
    </Collapsible>
  );
}
```

### 2. Server-Side Pagination (Companies)

**Pattern:** Server action returns paginated data

```typescript
// CompaniesTable.tsx
const [page, setPage] = useState(1);
const [data, setData] = useState<CompaniesData>();

useEffect(() => {
  listCompanies({ page, limit: 20, filter, search }).then(setData);
}, [page, filter, search]);

// Pagination controls
<Pagination
  currentPage={page}
  totalPages={data.totalPages}
  onPageChange={setPage}
/>
```

### 3. Optimistic UI (Status Update)

**Pattern:** Update UI immediately, rollback on error

```typescript
// Przed: ACTIVE
setOptimisticStatus('SUSPENDED');

const result = await updateCompanyStatus({ ... });

if (!result.success) {
  // Rollback
  setOptimisticStatus('ACTIVE');
  toast.error(result.error);
}
```

---

## Tłumaczenia

**Namespace:** `admin`

**Klucze:** 53 (companies table, categories manager, stats)

**Plik:** `messages/[locale]/admin.json`

### Przykład

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "companies": "Firmy",
    "categories": "Kategorie"
  },
  "companies": {
    "title": "Zarządzanie firmami",
    "verified": "Zweryfikowane",
    "notVerified": "Niezweryfikowane",
    "suspend": "Zawieś",
    "activate": "Aktywuj"
  },
  "categories": {
    "title": "Zarządzanie kategoriami",
    "createMain": "Utwórz kategorię główną",
    "createSub": "Dodaj subkategorię",
    "deleteConfirm": "Czy na pewno usunąć kategorię?"
  }
}
```

---

## Testy

**Test Suites:** 3 (task-06, task-07, task-08)

**Total Tests:** 254

**Coverage:** ~94%

### Test Scenarios

- ✅ Admin layout rendering (role check)
- ✅ Companies table (pagination, filtering, search)
- ✅ Status update (with audit log creation)
- ✅ Categories CRUD (create, update, delete)
- ✅ Category validation (unique slug, no cycles)
- ✅ Delete validation (has companies, has children)
- ✅ Hierarchical tree rendering

---

## Bezpieczeństwo

### 1. Role Verification

**Server-Side:**
```typescript
// W każdej admin action
const session = await auth();
if (session?.user?.role !== 'ADMIN') {
  return { success: false, error: 'Unauthorized' };
}
```

**Client-Side:**
```typescript
// W middleware.ts
if (pathname.startsWith('/admin') && user?.role !== 'ADMIN') {
  redirect('/panel');
}
```

### 2. Input Validation

**Wszystkie admin actions:**
- ✅ Zod schema validation
- ✅ Sanitization (nazw, slugów)
- ✅ Sprawdzanie istnienia (companyId, categoryId)

### 3. Audit Trail

**Każda akcja:**
- ✅ Zapisanie w AuditLog
- ✅ adminId powiązane z sesją
- ✅ Metadata z previous/new values

---

## Problemy i Rozwiązania

### Problem 1: Test Environment (task-10)

**Issue:** 3 test suites failing - `Cannot find module 'next/server'`

**Rozwiązanie:**
```typescript
// vitest.config.ts
alias: {
  'next/server': path.resolve(__dirname, 'src/__mocks__/next-server.ts')
}

// src/__mocks__/next-server.ts
export const revalidatePath = vi.fn();
```

### Problem 2: Category Slug Collisions

**Issue:** Dwie kategorie z podobnymi nazwami (np. "Test" i "test") generowały ten sam slug

**Rozwiązanie:** Unique constraint na `slug` + server-side validation przed zapisem

---

## Roadmap

### ✅ Completed (Stage 02)

- Admin layout + navigation
- Companies management
- Categories management
- Audit log (model + automatic creation)

### 🔜 Planned (Future Stages)

- **Audit Log UI:** Widok logów z filtrowaniem
- **Bulk Operations:** Masowe zawieszanie firm
- **Advanced Stats:** Dashboard z metrykami
- **Email Notifications:** Powiadomienia o zawieszeniu firmy
- **Role Management:** Nadawanie/odbieranie uprawnień admin

---

## Powiązana Dokumentacja

- [Admin Companies Actions](../../api/server-actions/admin-companies.md)
- [Admin Categories Actions](../../api/server-actions/admin-categories.md)
- [Admin Components](../../components/admin/README.md)
- [Database - AuditLog](../../database/models/audit-log.md)
- [Database - Category](../../database/models/category.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
**Generator:** exec-doc-generator (AI Spec Flow)
