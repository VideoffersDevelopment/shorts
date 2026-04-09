# {PROJECT_NAME} - Plan Architektury

**Wersja:** 1.0
**Data:** {DATE}
**Status:** Planowana (przed wdrożeniem)

---

## 1. Przegląd Systemu

### 1.1 Diagram Wysokopoziomowy

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    Next.js App Router                        │
│              Server Components + Client Components           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│              Server Actions + API Routes                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│                 PostgreSQL + Prisma ORM                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Technologiczny

| Kategoria  | Technologia        | Wersja | Uwagi             |
| ---------- | ------------------ | ------ | ----------------- |
| Framework  | Next.js            | 15.x   | App Router        |
| UI Library | React              | 19.x   | Server Components |
| Styling    | TailwindCSS        | 3.x    | + shadcn/ui       |
| Database   | PostgreSQL         | 15+    |                   |
| ORM        | Prisma             | 5.x    |                   |
| Auth       | {AUTH_SOLUTION}    |        |                   |
| Storage    | {STORAGE_SOLUTION} |        | Obrazy, pliki     |
| i18n       | next-intl          |        | 5 języków         |

---

## 2. Struktura Projektu (Planowana)

```
src/
├── app/
│   ├── (main)/
│   │   └── [locale]/
│   │       ├── panel/
│   │       │   ├── {section}/
│   │       │   │   └── {feature}/
│   │       │   │       ├── page.tsx
│   │       │   │       ├── [id]/
│   │       │   │       │   └── page.tsx
│   │       │   │       └── new/
│   │       │   │           └── page.tsx
│   │       │   └── layout.tsx
│   │       └── layout.tsx
│   ├── api/
│   │   └── {domain}/
│   │       └── route.ts
│   └── actions/
│       └── {domain}/
│           ├── create.ts
│           ├── update.ts
│           └── delete.ts
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── {domain}/              # Domain-specific components
│   └── shared/                # Shared components
├── lib/
│   ├── prisma.ts
│   ├── validation.ts          # Zod schemas
│   └── locales/
│       ├── pl/
│       ├── en/
│       ├── de/
│       ├── es/
│       └── ru/
└── types/
    └── {domain}.ts
```

---

## 3. Moduły i Domeny

### 3.1 Mapa Modułów

| Moduł      | Domena     | Etap | Zależności             |
| ---------- | ---------- | ---- | ---------------------- |
| {MODULE_1} | {DOMAIN_1} | 1    | -                      |
| {MODULE_2} | {DOMAIN_2} | 2    | {MODULE_1}             |
| {MODULE_3} | {DOMAIN_3} | 3    | {MODULE_1}, {MODULE_2} |

### 3.2 Diagram Zależności

```
[Etap 1: Core]
      ↓
[Etap 2: {MODULE_2}] ←→ [Etap 3: {MODULE_3}]
      ↓                        ↓
[Etap 4: {MODULE_4}] ←────────┘
```

---

## 4. Model Danych (High Level)

### 4.1 Główne Encje

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────→│  {ENTITY_1} │────→│  {ENTITY_2} │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│  {ENTITY_3} │     │  {ENTITY_4} │
└─────────────┘     └─────────────┘
```

### 4.2 Opis Encji

| Encja      | Opis               | Kluczowe relacje                     |
| ---------- | ------------------ | ------------------------------------ |
| User       | Użytkownik systemu | has many {ENTITIES}                  |
| {ENTITY_1} | {DESCRIPTION}      | belongs to User, has many {ENTITY_2} |
| {ENTITY_2} | {DESCRIPTION}      | belongs to {ENTITY_1}                |

---

## 5. Wzorce Architektoniczne

### 5.1 Server Components vs Client Components

| Typ              | Użycie                     | Przykład            |
| ---------------- | -------------------------- | ------------------- |
| Server Component | Pobieranie danych, SEO     | Lista, szczegóły    |
| Client Component | Interaktywność, formularze | Formularze, modalne |

### 5.2 Data Fetching Pattern

```
Page (Server Component)
    ↓
    Prisma Query (bezpośrednio)
    ↓
    Props do Client Components
```

### 5.3 Mutations Pattern

```
Client Component
    ↓
    Server Action (useActionState)
    ↓
    Zod Validation
    ↓
    Prisma Mutation
    ↓
    revalidatePath()
```

### 5.4 Form Pattern

```
react-hook-form + zodResolver
    ↓
    Server Action submission
    ↓
    Toast notification (success/error)
```

---

## 6. Routing

### 6.1 Struktura URL

| Sekcja       | Pattern                                    | Przykład                      |
| ------------ | ------------------------------------------ | ----------------------------- |
| Panel główny | `/[locale]/panel`                          | `/pl/panel`                   |
| {SECTION_1}  | `/[locale]/panel/{section}`                | `/pl/panel/business`          |
| {FEATURE_1}  | `/[locale]/panel/{section}/{feature}`      | `/pl/panel/business/dogs`     |
| Szczegóły    | `/[locale]/panel/{section}/{feature}/[id]` | `/pl/panel/business/dogs/123` |

### 6.2 Nawigacja

```
Sidebar
├── Dashboard
├── {SECTION_1}
│   ├── {FEATURE_1}
│   ├── {FEATURE_2}
│   └── {FEATURE_3}
├── {SECTION_2}
│   └── ...
└── Settings
```

---

## 7. Autentykacja i Autoryzacja

### 7.1 Autentykacja

- **Metoda:** {AUTH_METHOD}
- **Provider:** {AUTH_PROVIDER}
- **Session:** {SESSION_TYPE}

### 7.2 Role i Uprawnienia

| Rola     | Opis          | Uprawnienia   |
| -------- | ------------- | ------------- |
| {ROLE_1} | {DESCRIPTION} | {PERMISSIONS} |
| {ROLE_2} | {DESCRIPTION} | {PERMISSIONS} |

### 7.3 Ownership Pattern

```
User → owns → {ENTITY}
Query: WHERE userId = currentUser.id
```

---

## 8. Internacjonalizacja (i18n)

### 8.1 Języki

| Kod | Język   | Status   |
| --- | ------- | -------- |
| pl  | Polski  | Domyślny |
| en  | English | Wymagany |
| de  | Deutsch | Wymagany |
| es  | Español | Wymagany |
| ru  | Русский | Wymagany |

### 8.2 Struktura Tłumaczeń

```
src/lib/locales/
├── pl/
│   ├── common.json
│   ├── panel.json
│   └── {domain}.json
├── en/
│   └── ...
└── ...
```

---

## 9. Integracje Zewnętrzne

| Serwis      | Cel       | Etap wdrożenia |
| ----------- | --------- | -------------- |
| {SERVICE_1} | {PURPOSE} | Etap {N}       |
| {SERVICE_2} | {PURPOSE} | Etap {N}       |

---

## 10. Wymagania Infrastrukturalne

### 10.1 Środowiska

| Środowisko  | URL            | Baza danych      |
| ----------- | -------------- | ---------------- |
| Development | localhost:3000 | Local PostgreSQL |
| Staging     | {URL}          | {DB}             |
| Production  | {URL}          | {DB}             |

### 10.2 Zmienne Środowiskowe

```
DATABASE_URL=
NEXTAUTH_SECRET=
{SERVICE}_API_KEY=
```

---

## 11. Ewolucja Architektury

### Po Etapie 1

- [ ] Utworzyć `architecture.md` w AI Spec Flow
- [ ] Zaktualizować coding-practices.md

### Po Etapie 2

- [ ] Zaktualizować `architecture.md` o nowe moduły
- [ ] Dodać nowe patterns do coding-practices.md

---

## Historia Zmian

| Data   | Wersja | Opis            | Autor    |
| ------ | ------ | --------------- | -------- |
| {DATE} | 1.0    | Plan początkowy | {AUTHOR} |
