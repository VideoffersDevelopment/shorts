# Task 09: Navigation & Translations

## Overview

**Priority:** HIGH
**Dependencies:** task-03, task-06
**Complexity:** Medium (18 files, ~18k tokens)
**Status:** pending

## What to Build

Extend navigation components with role-based menu items and create complete translation files for all 5 languages (pl, en, de, es, ru). This task integrates all Stage 02 features into the UI.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/locales/pl/companies.json` | Create | Polish translations |
| `src/lib/locales/en/companies.json` | Create | English translations |
| `src/lib/locales/de/companies.json` | Create | German translations |
| `src/lib/locales/es/companies.json` | Create | Spanish translations |
| `src/lib/locales/ru/companies.json` | Create | Russian translations |
| `src/lib/locales/pl/admin.json` | Create | Polish admin translations |
| `src/lib/locales/en/admin.json` | Create | English admin translations |
| `src/lib/locales/de/admin.json` | Create | German admin translations |
| `src/lib/locales/es/admin.json` | Create | Spanish admin translations |
| `src/lib/locales/ru/admin.json` | Create | Russian admin translations |
| `src/lib/locales/pl/categories.json` | Create | Polish category translations |
| `src/lib/locales/en/categories.json` | Create | English category translations |
| `src/lib/locales/de/categories.json` | Create | German category translations |
| `src/lib/locales/es/categories.json` | Create | Spanish category translations |
| `src/lib/locales/ru/categories.json` | Create | Russian category translations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/user-menu.tsx` | Add upgrade/company/admin links |
| `src/components/layout/app-sidebar.tsx` | Add role-based menu items |
| `src/lib/locales/pl/errors.json` | Add new error messages |
| (Same for en, de, es, ru) | Add error translations |

## Navigation Extensions

### User Menu Extension

```typescript
// src/components/layout/user-menu.tsx (EXTEND)
import { Building2, Shield } from "lucide-react"

// Add to existing menu items:

// For USER role:
{
  href: `/${locale}/settings/upgrade`,
  label: t("menu.upgradeToCompany"),
  icon: Building2,
  show: session.user.role === "USER"
}

// For COMPANY role:
{
  href: `/${locale}/panel/company/profile`,
  label: t("menu.companyProfile"),
  icon: Building2,
  show: session.user.role === "COMPANY"
}

// For ADMIN role:
{
  href: `/${locale}/admin`,
  label: t("menu.adminPanel"),
  icon: Shield,
  show: session.user.role === "ADMIN"
}
```

### Sidebar Extension

```typescript
// src/components/layout/app-sidebar.tsx (EXTEND)
import { Building2, Shield } from "lucide-react"

// Add role-based menu items

const menuItems = [
  ...baseItems, // existing from Stage 01

  // Company items (show only if COMPANY)
  ...(session.user.role === "COMPANY" ? [
    {
      href: `/${locale}/panel/company/profile`,
      label: t("sidebar.company.profile"),
      icon: Building2
    }
  ] : []),

  // Admin link (show only if ADMIN)
  ...(session.user.role === "ADMIN" ? [
    {
      href: `/${locale}/admin`,
      label: t("sidebar.admin"),
      icon: Shield
    }
  ] : [])
]
```

## Translation Files

### Companies Translations (Polish)

```json
// src/lib/locales/pl/companies.json
{
  "upgrade": {
    "title": "Upgrade do Konta Firmowego",
    "heading": "Zostań firmą na VideoShorts",
    "description": "Wypełnij formularz aby założyć profil firmowy i publikować shorty",
    "fields": {
      "companyName": "Nazwa firmy",
      "nip": "NIP",
      "address": "Adres siedziby",
      "contactEmail": "Email kontaktowy",
      "phone": "Telefon (opcjonalnie)"
    },
    "submit": "Utwórz profil firmowy",
    "success": {
      "verified": "Firma zweryfikowana! Możesz publikować shorty",
      "pending": "Wniosek złożony. Weryfikacja w toku"
    }
  },
  "profile": {
    "verified": "Zweryfikowana",
    "stats": {
      "shorts": "Shorty",
      "followers": "Obserwujący",
      "views": "Wyświetlenia"
    },
    "edit": {
      "title": "Edytuj profil firmowy",
      "save": "Zapisz zmiany"
    }
  },
  "logo": {
    "title": "Zmień logo",
    "upload": "Wybierz plik",
    "uploading": "Przesyłanie...",
    "cancel": "Anuluj",
    "success": "Logo zaktualizowane",
    "errors": {
      "invalidType": "Nieprawidłowy typ pliku",
      "tooLarge": "Plik zbyt duży (max 5MB)",
      "uploadFailed": "Nie udało się przesłać pliku"
    }
  },
  "errors": {
    "alreadyCompany": "Posiadasz już konto firmowe",
    "nipExists": "Ten NIP jest już zarejestrowany",
    "createFailed": "Nie udało się utworzyć profilu",
    "notCompany": "Nie posiadasz konta firmowego",
    "updateFailed": "Nie udało się zapisać zmian"
  }
}
```

### Admin Translations (Polish)

```json
// src/lib/locales/pl/admin.json
{
  "title": "Panel Administracyjny",
  "nav": {
    "dashboard": "Dashboard",
    "companies": "Firmy",
    "categories": "Kategorie",
    "users": "Użytkownicy",
    "audit": "Logi"
  },
  "dashboard": {
    "title": "Dashboard",
    "stats": {
      "companies": "Firmy",
      "users": "Użytkownicy",
      "categories": "Kategorie",
      "pending": "oczekuje"
    }
  },
  "companies": {
    "title": "Zarządzanie firmami",
    "table": {
      "name": "Nazwa",
      "nip": "NIP",
      "email": "Email",
      "status": "Status",
      "actions": "Akcje"
    },
    "status": {
      "verified": "Zweryfikowana",
      "pending": "Oczekuje"
    },
    "actions": {
      "verify": "Zweryfikuj",
      "reject": "Odrzuć",
      "view": "Podgląd"
    },
    "search": {
      "placeholder": "Szukaj firmy..."
    },
    "filter": {
      "status": "Status",
      "all": "Wszystkie",
      "verified": "Zweryfikowane",
      "pending": "Oczekujące"
    },
    "verify": {
      "success": "Firma zweryfikowana"
    },
    "reject": {
      "reasonPrompt": "Podaj powód odrzucenia:",
      "success": "Firma odrzucona"
    }
  },
  "categories": {
    "title": "Zarządzanie kategoriami",
    "create": "Dodaj kategorię",
    "edit": "Edytuj kategorię",
    "update": "Zapisz zmiany",
    "cancel": "Anuluj",
    "enabled": "Aktywna",
    "disabled": "Nieaktywna",
    "companies": "firm",
    "fields": {
      "name": "Nazwa",
      "slug": "Slug",
      "icon": "Ikona",
      "parent": "Kategoria nadrzędna",
      "parentPlaceholder": "Wybierz kategorię",
      "noParent": "Brak (kategoria główna)"
    },
    "create": {
      "success": "Kategoria utworzona"
    },
    "update": {
      "success": "Kategoria zaktualizowana"
    },
    "delete": {
      "confirm": "Czy na pewno chcesz usunąć tę kategorię?",
      "success": "Kategoria usunięta",
      "hasCompanies": "Nie można usunąć kategorii z {count} firmami"
    }
  },
  "errors": {
    "verifyFailed": "Nie udało się zweryfikować firmy",
    "rejectFailed": "Nie udało się odrzucić firmy",
    "reasonRequired": "Podaj powód odrzucenia",
    "categoryCreateFailed": "Nie udało się utworzyć kategorii",
    "categoryNotFound": "Kategoria nie znaleziona",
    "categoryHasCompanies": "Kategoria posiada przypisane firmy",
    "categoryDeleteFailed": "Nie udało się usunąć kategorii"
  }
}
```

### Categories Translations (Polish)

```json
// src/lib/locales/pl/categories.json
{
  "picker": {
    "label": "Kategoria",
    "placeholder": "Wybierz kategorię"
  }
}
```

### Errors Translations (Polish)

```json
// src/lib/locales/pl/errors.json (EXTEND)
{
  "unauthorized": "Brak autoryzacji",
  "notFound": "Nie znaleziono",
  "serverError": "Błąd serwera",
  "validationError": "Błąd walidacji danych"
}
```

**Note:** Repeat similar structure for all 5 languages (pl, en, de, es, ru). Full translations provided in architecture document.

## Acceptance Criteria

- [ ] User menu shows "Upgrade to Company" for USER role
- [ ] User menu shows "Company Profile" for COMPANY role
- [ ] User menu shows "Admin Panel" for ADMIN role
- [ ] Sidebar shows company items for COMPANY role
- [ ] Sidebar shows admin link for ADMIN role
- [ ] All 5 languages have complete translations
- [ ] Companies namespace: upgrade, profile, logo, errors
- [ ] Admin namespace: nav, dashboard, companies, categories, errors
- [ ] Categories namespace: picker
- [ ] Errors namespace: common errors
- [ ] Navigation icons imported from lucide-react
- [ ] Role-based visibility working correctly
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test users: USER, COMPANY, ADMIN roles

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Login as USER | User menu shows "Upgrade" link | User menu dropdown |
| 2 | Login as COMPANY | User menu shows "Company Profile" | User menu dropdown |
| 3 | Login as ADMIN | User menu shows "Admin Panel" | User menu dropdown |
| 4 | Check sidebar (COMPANY) | Shows company items | Sidebar |
| 5 | Check sidebar (ADMIN) | Shows admin link | Sidebar |
| 6 | Switch language to EN | All texts translated | Locale switcher |
| 7 | Switch language to DE | All texts translated | Locale switcher |
| 8 | Test error messages | Translated error toasts | Trigger errors |

### Screenshot Checkpoints
- `01-user-menu-user.png` - USER role menu
- `02-user-menu-company.png` - COMPANY role menu
- `03-user-menu-admin.png` - ADMIN role menu
- `04-sidebar-company.png` - Sidebar for COMPANY
- `05-sidebar-admin.png` - Sidebar for ADMIN
- `06-lang-en.png` - English translations
- `07-lang-de.png` - German translations

## Notes

- **5 Languages:** pl, en, de, es, ru (complete coverage)
- **Role-Based Visibility:** Menu items shown based on user.role
- **Icon Consistency:** Use lucide-react (Building2, Shield)
- **Translation Keys:** Nested structure for clarity
- **Error Messages:** Standardized across all features
