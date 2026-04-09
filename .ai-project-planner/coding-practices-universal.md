# Coding Practices - Universal

> **Wersja:** 1.0
> **Przeznaczenie:** Bazowe praktyki do wykorzystania w każdym projekcie Next.js/React
> **Użycie:** Skopiuj do nowego projektu jako bazę `coding-practices.md`

## 🎯 O tym dokumencie

Ten dokument zawiera **uniwersalne** praktyki kodowania dla projektów:

- Next.js 14/15 (App Router)
- React 18/19
- TypeScript
- Prisma ORM
- Zod validation
- TailwindCSS + shadcn/ui

**Jak używać:**

1. Skopiuj ten plik do `.ai-spec-flow/coding-practices.md` w nowym projekcie
2. Dostosuj sekcję "Database Protection" do swojego środowiska
3. System będzie ewoluował praktyki w miarę kodowania

---

## 🛡️ DATABASE PROTECTION

**CRITICAL: Dostosuj tę sekcję do swojego środowiska!**

### ❌ FORBIDDEN DATABASE OPERATIONS:

- `npx prisma migrate reset` - Resets entire database
- `npx prisma db push --force-reset` - Force resets schema
- Any SQL `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` without WHERE clause
- Mass deletion scripts without explicit user confirmation

### ✅ SAFE DATABASE OPERATIONS:

- `npx prisma generate` - Generate Prisma client (read-only)
- `npx prisma migrate dev` - Create and apply migrations (additive changes)
- `npx prisma db push` - Push schema changes (additive only)
- `npx prisma studio` - Open Prisma Studio (view data)
- Targeted updates/deletes with specific WHERE clauses

### Database Safety Protocol:

1. **ALWAYS ask user for confirmation** before ANY destructive operation
2. **Test migrations locally first** before applying to shared/production database
3. **Backup critical data** before schema changes
4. **Use --dry-run flags** when available

---

## 🚫 TypeScript Type Safety

### Zasada #1: ABSOLUTNY ZAKAZ typu `any`

**Nigdy nie używaj `any` type** - create dedicated interfaces/types.

❌ **ŹLE:**

```typescript
function processData(data: any) {
	return data.someProperty;
}
```

✅ **DOBRZE:**

```typescript
interface DataType {
	someProperty: string;
	otherProperty: number;
}

function processData(data: DataType) {
	return data.someProperty;
}
```

---

### Zasada #2: React Hooks - Complete Dependency Arrays

**Zawsze uwzględniaj WSZYSTKIE zależności** w useEffect/useCallback dependency arrays.

❌ **ŹLE:**

```typescript
useEffect(() => {
	loadData();
}, [id]); // ❌ Brakuje loadData
```

✅ **DOBRZE:**

```typescript
const loadData = useCallback(async () => {
	// ... implementation
}, [id]);

useEffect(() => {
	loadData();
}, [loadData]); // ✅
```

---

### Zasada #3: Props - Sprawdź Wymagane Właściwości

**Przed użyciem komponentu sprawdź jego interface** i upewnij się że wszystkie required props są przekazane.

```typescript
// Zawsze czytaj interface przed użyciem komponentu
interface ButtonProps {
	onClick: () => void;
	children: React.ReactNode;
	variant?: "default" | "destructive"; // optional
}
```

---

### Zasada #4: Refs - Dopasuj Typ do Elementu

**Typ ref musi odpowiadać typowi elementu.**

```typescript
// Dla button:
const buttonRef = useRef<HTMLButtonElement>(null);

// Dla div:
const containerRef = useRef<HTMLDivElement>(null);

// Dla input:
const inputRef = useRef<HTMLInputElement>(null);
```

---

### Zasada #5: Importy Typów

**Importuj typy jawnie** z `type` keyword.

```typescript
import { type IFuseOptions } from "fuse.js";
import { type User, type Session } from "@/types";
```

---

### Zasada #6: JSON Compatibility - Prisma JsonValue

**Używaj serializacji** dla złożonych obiektów przed zapisem do Prisma JsonValue fields.

```typescript
// Utility functions
export function safeJsonStringify(value: unknown): string {
	return JSON.stringify(value);
}

export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return fallback;
	}
}
```

---

## ⚛️ React Best Practices

### Zasada #1: Server Components vs Client Components

**Domyślnie używaj Server Components.** Client Components tylko gdy potrzebna interaktywność.

| Użyj Server Component | Użyj Client Component    |
| --------------------- | ------------------------ |
| Pobieranie danych     | useState, useEffect      |
| Dostęp do backendu    | Event handlers (onClick) |
| Wrażliwe dane         | Browser APIs             |
| Duże dependencies     | Interaktywne formularze  |

```typescript
// Server Component (default)
async function UserList() {
	const users = await prisma.user.findMany();
	return (
		<ul>
			{users.map((u) => (
				<li key={u.id}>{u.name}</li>
			))}
		</ul>
	);
}

// Client Component (when needed)
("use client");
function Counter() {
	const [count, setCount] = useState(0);
	return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

---

### Zasada #2: Server Actions Pattern

**Używaj Server Actions dla mutacji danych.**

```typescript
// src/app/actions/users/create.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
	// 1. Auth check
	const session = await auth();
	if (!session?.user) {
		return { error: "Unauthorized" };
	}

	// 2. Validation
	const parsed = userSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) {
		return { error: parsed.error.flatten() };
	}

	// 3. Database operation
	try {
		const user = await prisma.user.create({
			data: parsed.data,
		});

		// 4. Revalidate
		revalidatePath("/users");

		return { success: true, data: user };
	} catch (error) {
		return { error: "Failed to create user" };
	}
}
```

---

### Zasada #3: Form Pattern (React Hook Form + Zod)

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validation";
import { createUser } from "@/app/actions/users/create";

export function UserForm() {
	const form = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			name: "",
			email: "",
		},
	});

	async function onSubmit(data: UserFormData) {
		const result = await createUser(data);
		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success("User created");
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>{/* form fields */}</form>
		</Form>
	);
}
```

---

## ✅ Zod Validation

### Zasada #1: Centralizuj Schematy

```typescript
// src/lib/validation.ts
import { z } from "zod";

export const userSchema = z.object({
	name: z.string().min(2, "Name too short"),
	email: z.string().email("Invalid email"),
	age: z.number().min(0).optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
```

---

### Zasada #2: UUID vs CUID

**Sprawdź typ ID w Prisma schema** i użyj odpowiedniej walidacji.

```typescript
// Jeśli Prisma używa @default(uuid())
const idSchema = z.string().uuid();

// Jeśli Prisma używa @default(cuid())
const idSchema = z.string().cuid();

// Sprawdź w schema.prisma:
// id String @id @default(uuid()) @db.Uuid  → użyj .uuid()
// id String @id @default(cuid())           → użyj .cuid()
```

---

## 🌍 Internationalization (i18n)

### Zasada #1: Struktura Tłumaczeń

```
src/lib/locales/
├── pl/
│   ├── common.json
│   ├── panel.json
│   └── {feature}.json
├── en/
│   └── ...
├── de/
│   └── ...
├── es/
│   └── ...
└── ru/
    └── ...
```

---

### Zasada #2: Używanie Tłumaczeń

```typescript
// Server Component
import { getTranslations } from "next-intl/server";

async function Page() {
	const t = await getTranslations("feature");
	return <h1>{t("title")}</h1>;
}

// Client Component
("use client");
import { useTranslations } from "next-intl";

function Component() {
	const t = useTranslations("feature");
	return <button>{t("submit")}</button>;
}
```

---

### Zasada #3: ZAWSZE Dodaj Wszystkie 5 Języków

Przy dodawaniu nowych kluczy, ZAWSZE dodaj do wszystkich plików:

- `pl/*.json`
- `en/*.json`
- `de/*.json`
- `es/*.json`
- `ru/*.json`

---

## 📁 File Structure Conventions

### Zasada #1: App Router Structure

```
src/app/
├── (main)/
│   └── [locale]/
│       ├── panel/
│       │   ├── {section}/
│       │   │   └── {feature}/
│       │   │       ├── page.tsx        # List
│       │   │       ├── [id]/
│       │   │       │   └── page.tsx    # Detail
│       │   │       └── new/
│       │   │           └── page.tsx    # Create
│       │   └── layout.tsx
│       └── layout.tsx
├── api/
│   └── {domain}/
│       └── route.ts
└── actions/
    └── {domain}/
        ├── create.ts
        ├── update.ts
        └── delete.ts
```

---

### Zasada #2: Component Organization

```
src/components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── form.tsx
├── {domain}/              # Domain-specific
│   ├── {domain}-form.tsx
│   ├── {domain}-card.tsx
│   └── {domain}-list.tsx
└── shared/                # Shared across domains
    ├── data-table.tsx
    └── search-input.tsx
```

---

## 🔒 Security

### Zasada #1: Ownership Verification

**ZAWSZE weryfikuj ownership** przed operacjami na danych.

```typescript
// ❌ ŹLE - brak weryfikacji
const item = await prisma.item.findUnique({ where: { id } });

// ✅ DOBRZE - weryfikacja ownership
const item = await prisma.item.findFirst({
	where: {
		id,
		userId: session.user.id, // ownership check
	},
});
```

---

### Zasada #2: Input Sanitization

**Zawsze waliduj i sanityzuj input** przed użyciem.

```typescript
// Server Action
export async function updateProfile(formData: FormData) {
	const parsed = profileSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) {
		return { error: "Invalid input" };
	}
	// Use parsed.data - already validated
}
```

---

## 🎨 UI/UX Conventions

### Zasada #1: Loading States

```typescript
// Suspense for Server Components
<Suspense fallback={<Skeleton />}>
	<AsyncComponent />
</Suspense>;

// Loading state for Client Components
const [isLoading, setIsLoading] = useState(false);
```

---

### Zasada #2: Error Handling

```typescript
// Toast notifications for user feedback
import { toast } from "sonner";

try {
	await action();
	toast.success("Operation successful");
} catch (error) {
	toast.error("Something went wrong");
}
```

---

### Zasada #3: Responsive Design

**Mobile-first approach** z TailwindCSS breakpoints.

```typescript
<div className="
  grid
  grid-cols-1      // mobile
  md:grid-cols-2   // tablet
  lg:grid-cols-3   // desktop
  gap-4
">
```

---

## 📝 Evolution Section

> **Poniżej dodawane są nowe zasady przez Coding Practices Updater.**

<!-- NEW RULES WILL BE ADDED BELOW THIS LINE -->
