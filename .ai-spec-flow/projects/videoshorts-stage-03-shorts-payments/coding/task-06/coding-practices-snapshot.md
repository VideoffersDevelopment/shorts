# Coding Practices - Compact Version

> **Dla:** Coder, Fixer | **Pełna wersja:** coding-practices.md

---

## 🛡️ DATABASE PROTECTION (ABSOLUTE)

**FORBIDDEN:** `db:reset`, `migrate reset`, `DROP`, `TRUNCATE`, `DELETE FROM` bez WHERE
**SAFE:** `db:generate`, `db:migrate`, `db:push`, `db:studio`, targeted WHERE

---

## 🚫 TypeScript Rules (10)

| #   | Rule               | Pattern                                | Anti-pattern      |
| --- | ------------------ | -------------------------------------- | ----------------- |
| 1   | NO `any`           | `interface X { prop: string }`         | `data: any`       |
| 2   | Hook deps          | `useEffect(() => {}, [a, b])` all deps | missing deps      |
| 3   | Callback deps      | `useCallback(() => fn(), [fn])`        | `[/* empty */]`   |
| 4   | Ref types          | `useRef<HTMLButtonElement>(null)`      | `useRef(null)`    |
| 5   | Type imports       | `import { type X } from 'y'`           | namespace imports |
| 6   | Strict null        | `user?.name ?? 'default'`              | `user.name`       |
| 7   | Return types       | `function(): Promise<User>`            | implicit any      |
| 8   | Props interface    | `interface Props { x: string }`        | inline types      |
| 9   | No ts-ignore       | fix the type                           | `// @ts-ignore`   |
| 10  | API response types | `const data: ApiResponse = ...`        | untyped fetch     |

---

## ⚛️ React Patterns

**Component order:** imports → types → component → hooks → callbacks → effects → render

**Server Actions:**

```typescript
"use server";
// 1. Auth check → 2. Validate (Zod) → 3. Ownership check → 4. DB operation → 5. revalidatePath
```

**Client Components:**

```typescript
"use client";
// useTranslations('namespace') for i18n
// useCallback for handlers passed as props
```

---

## 🌍 i18n (REQUIRED)

| Context          | Method                           | Example                 |
| ---------------- | -------------------------------- | ----------------------- |
| Server Component | `getText(key, fallback, locale)` | `t('title', 'Default')` |
| Client Component | `useTranslations('ns')`          | `t('key')`              |
| Toast/Dialog     | `useTranslations`                | `t('success')`          |

**Files:** `src/lib/locales/{pl,en,de,es,ru,uk}/[feature].json`

---

## 📦 Validation

**Location:** `src/lib/validation.ts`
**Pattern:** Zod schemas reused in API routes + Server Actions

```typescript
export const createXSchema = z.object({ ... })
// Use: createXSchema.parse(data)
```

---

## 🎨 Naming

| Type       | Convention | Example           |
| ---------- | ---------- | ----------------- |
| Files      | kebab-case | `litter-card.tsx` |
| Components | PascalCase | `LitterCard`      |
| Hooks      | use-prefix | `useLitters`      |
| Constants  | SCREAMING  | `MAX_SIZE`        |

---

## 🔒 Security

**Server Actions:**

1. `getServerSession()` - auth check
2. Ownership verification - `where: { userId: session.user.id }`
3. Input validation - Zod parse
4. `revalidatePath()` - cache invalidation

**NEVER:** Trust client data, skip auth, expose internal errors

---

## 📁 File Structure

```
src/app/actions/[domain]/     # Server Actions
src/components/[domain]/      # React Components
src/lib/[domain]/             # Business logic
src/lib/locales/[lang]/       # Translations
```

---

## ✅ Pre-Commit Checklist

- [ ] No `any` types
- [ ] All hook deps included
- [ ] `revalidatePath` in mutations
- [ ] i18n for all UI text
- [ ] Cache cleared & build passes:
  ```bash
  rm -rf .next && npm run build
  ```

---

## 🚨 Recent Rules (Auto-Added)

| #   | Rule                         | Pattern                                  | Anti-pattern                   |
| --- | ---------------------------- | ---------------------------------------- | ------------------------------ |
| 12  | Custom i18n import           | `from '@/lib/i18n/client'`               | `from 'next-intl'`             |
| 13  | useTranslations destructure  | `const { t } = useTranslations('ns')`    | `const t = useTranslations()`  |
| 14  | i18n namespace kebab-case    | `useTranslations('stud-services')`       | `useTranslations('studServices')` |
| 11  | i18n no hardcoded text       | `t('key')` for all UI text               | hardcoded Polish strings       |

**Key i18n Rules:**
- ALWAYS use `@/lib/i18n/client` NOT `next-intl` in Client Components
- ALWAYS destructure: `const { t } = useTranslations('namespace')`
- Namespace MUST match filename: `stud-services.json` → `'stud-services'`

---

**Full docs:** [coding-practices.md](./coding-practices.md)
