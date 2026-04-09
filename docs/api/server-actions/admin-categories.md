# Admin Categories Server Actions

Server Actions dla administracyjnego zarządzania kategoriami.

**Lokalizacja:** `src/app/actions/admin/categories/`
**Wymagane uprawnienia:** ADMIN
**Namespace:** admin/categories

---

## Przegląd

| Action | Plik | Opis |
|--------|------|------|
| `listCategories` | `list.ts` | Lista kategorii (hierarchiczna) |
| `createCategory` | `create.ts` | Tworzenie kategorii/subkategorii |
| `updateCategory` | `update.ts` | Aktualizacja nazw i ikony |
| `deleteCategory` | `delete.ts` | Usuwanie (z walidacją) |

---

## listCategories

Pobiera hierarchiczną listę wszystkich kategorii.

### Sygnatura

```typescript
async function listCategories(): Promise<ActionResult<{
  categories: CategoryTree[]
}>>
```

### Returns

```typescript
{
  success: true,
  data: {
    categories: [
      {
        id: "cat_123",
        name: { pl: "Gastronomia", en: "Food & Beverage", ... },
        slug: "gastronomia",
        icon: "Utensils",
        parentId: null,
        order: 0,
        children: [
          {
            id: "cat_456",
            name: { pl: "Restauracje", en: "Restaurants", ... },
            slug: "restauracje",
            icon: "ChefHat",
            parentId: "cat_123",
            order: 0,
            children: []
          }
        ]
      }
    ]
  }
}
```

### Przykład

```typescript
import { listCategories } from '@/app/actions/admin/categories/list';

const result = await listCategories();

if (result.success) {
  const { categories } = result.data;
  // Render hierarchical tree...
}
```

---

## createCategory

Tworzy nową kategorię główną lub subkategorię.

### Sygnatura

```typescript
async function createCategory(
  data: CreateCategoryInput
): Promise<ActionResult<{ category: Category }>>
```

### Input Schema

```typescript
const createCategorySchema = z.object({
  name: z.object({
    pl: z.string().min(2).max(50),
    en: z.string().min(2).max(50),
    de: z.string().min(2).max(50),
    es: z.string().min(2).max(50),
    ru: z.string().min(2).max(50)
  }),
  icon: z.string().optional(), // Lucide icon name
  parentId: z.string().optional() // null = main category
});
```

### Parametry

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `name` | object | ✅ | Nazwa w 5 językach |
| `icon` | string | ❌ | Nazwa ikony z Lucide React |
| `parentId` | string | ❌ | ID kategorii nadrzędnej (null = główna) |

### Walidacja

**Unique Slug:**
- Slug generowany z `name.pl` (transliteracja)
- Sprawdzenie unikalności w bazie przed zapisem
- Error jeśli slug już istnieje

**Parent Validation:**
- Jeśli `parentId` podane, musi istnieć w bazie
- Parent nie może być subkategorią (max 2 poziomy)

### Returns

```typescript
{
  success: true,
  data: {
    category: {
      id: "cat_789",
      name: { pl: "Nowa kategoria", ... },
      slug: "nowa-kategoria",
      icon: "Star",
      parentId: null,
      order: 0,
      createdAt: "2025-12-22T10:00:00Z"
    }
  }
}
```

### Błędy

| Code | Message | Przyczyna |
|------|---------|-----------|
| `SLUG_EXISTS` | Slug already exists | Kategoria z tym slugiem już istnieje |
| `PARENT_NOT_FOUND` | Parent category not found | parentId nie istnieje |
| `INVALID_HIERARCHY` | Cannot create subcategory of subcategory | Parent jest już subkategorią |

### Przykład

```typescript
import { createCategory } from '@/app/actions/admin/categories/create';

// Kategoria główna
const mainCategory = await createCategory({
  name: {
    pl: "Gastronomia",
    en: "Food & Beverage",
    de: "Gastronomie",
    es: "Gastronomía",
    ru: "Гастрономия"
  },
  icon: "Utensils"
  // parentId: null (domyślnie)
});

// Subkategoria
const subCategory = await createCategory({
  name: {
    pl: "Restauracje",
    en: "Restaurants",
    de: "Restaurants",
    es: "Restaurantes",
    ru: "Рестораны"
  },
  icon: "ChefHat",
  parentId: mainCategory.data.category.id
});
```

### Audit Log

```typescript
await prisma.auditLog.create({
  data: {
    adminId: session.user.id,
    action: 'CREATE_CATEGORY',
    targetType: 'CATEGORY',
    targetId: category.id,
    metadata: {
      name: category.name,
      parentId: category.parentId
    }
  }
});
```

---

## updateCategory

Aktualizuje nazwy i ikonę kategorii.

### Sygnatura

```typescript
async function updateCategory(
  data: UpdateCategoryInput
): Promise<ActionResult<{ category: Category }>>
```

### Input Schema

```typescript
const updateCategorySchema = z.object({
  categoryId: z.string(),
  name: z.object({
    pl: z.string().min(2).max(50),
    en: z.string().min(2).max(50),
    de: z.string().min(2).max(50),
    es: z.string().min(2).max(50),
    ru: z.string().min(2).max(50)
  }).optional(),
  icon: z.string().optional()
});
```

### Parametry

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `categoryId` | string | ✅ | ID kategorii do aktualizacji |
| `name` | object | ❌ | Nowe nazwy w 5 językach |
| `icon` | string | ❌ | Nowa ikona |

**Uwaga:** Co najmniej jedno pole (name lub icon) musi być podane.

### Przykład

```typescript
import { updateCategory } from '@/app/actions/admin/categories/update';

// Zmiana nazwy
await updateCategory({
  categoryId: "cat_123",
  name: {
    pl: "Gastronomia i Catering",
    en: "Food & Catering",
    de: "Gastronomie und Catering",
    es: "Gastronomía y Catering",
    ru: "Гастрономия и Кейтеринг"
  }
});

// Zmiana ikony
await updateCategory({
  categoryId: "cat_123",
  icon: "UtensilsCrossed"
});
```

### Audit Log

```typescript
metadata: {
  previousName: category.name,
  newName: updatedCategory.name,
  previousIcon: category.icon,
  newIcon: updatedCategory.icon
}
```

---

## deleteCategory

Usuwa kategorię z walidacją zależności.

### Sygnatura

```typescript
async function deleteCategory(
  data: DeleteCategoryInput
): Promise<ActionResult<void>>
```

### Input Schema

```typescript
const deleteCategorySchema = z.object({
  categoryId: z.string()
});
```

### Walidacja

**Blokada usunięcia jeśli:**

1. **Kategoria ma przypisane firmy**
   ```sql
   SELECT COUNT(*) FROM CompanyProfile WHERE categoryId = ?
   -- OR subcategoryIds @> ARRAY[?]
   ```
   Error: "Cannot delete category with assigned companies"

2. **Kategoria ma subkategorie**
   ```sql
   SELECT COUNT(*) FROM Category WHERE parentId = ?
   ```
   Error: "Cannot delete category with subcategories"

### Returns

```typescript
{
  success: true,
  data: undefined
}
```

### Błędy

| Code | Message | Przyczyna |
|------|---------|-----------|
| `HAS_COMPANIES` | Cannot delete category with assigned companies | Firmy używają tej kategorii |
| `HAS_CHILDREN` | Cannot delete category with subcategories | Kategoria ma subkategorie |
| `NOT_FOUND` | Category not found | categoryId nie istnieje |

### Przykład

```typescript
import { deleteCategory } from '@/app/actions/admin/categories/delete';

const result = await deleteCategory({
  categoryId: "cat_123"
});

if (!result.success) {
  if (result.code === 'HAS_COMPANIES') {
    toast.error('Usuń najpierw firmy z tej kategorii');
  } else if (result.code === 'HAS_CHILDREN') {
    toast.error('Usuń najpierw subkategorie');
  }
}
```

### Audit Log

```typescript
metadata: {
  deletedName: category.name,
  deletedSlug: category.slug,
  hadChildren: false,
  hadCompanies: false
}
```

---

## Category Model

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   // JSON: {pl, en, de, es, ru}
  slug      String   @unique
  icon      String?
  parentId  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent          Category?        @relation("CategoryHierarchy", ...)
  children        Category[]       @relation("CategoryHierarchy")
  companyProfiles CompanyProfile[]

  @@index([slug, parentId])
}
```

---

## Utilities

### Slug Generation

**Implementacja:** `src/lib/utils/categories.ts`

```typescript
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
    .replace(/^-+|-+$/g, ''); // Trim dashes
}

// Przykłady:
// "Gastronomia" → "gastronomia"
// "Zdrowie & Uroda" → "zdrowie-uroda"
// "Café & Restaurant" → "cafe-restaurant"
```

### Build Category Tree

```typescript
export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  // First pass: create nodes
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build hierarchy
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      parent?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

---

## Testy

**Lokalizacja:** `src/app/actions/admin/categories/__tests__/`

**Test Suites:** 4 (list, create, update, delete)

**Total Tests:** 145

**Coverage:** ~98%

### Test Scenarios

**create.test.ts:**
- ✅ Create main category
- ✅ Create subcategory
- ✅ Duplicate slug error
- ✅ Parent not found error
- ✅ Invalid hierarchy (subcategory of subcategory)
- ✅ Audit log creation

**update.test.ts:**
- ✅ Update name only
- ✅ Update icon only
- ✅ Update both name and icon
- ✅ Category not found

**delete.test.ts:**
- ✅ Successful delete (no dependencies)
- ✅ Block delete (has companies)
- ✅ Block delete (has children)
- ✅ Audit log creation

---

## Powiązana Dokumentacja

- [Admin Panel Feature](../../features/admin/README.md)
- [CategoriesManager Component](../../components/admin/categories-manager.md)
- [Category Model](../../database/models/category.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
