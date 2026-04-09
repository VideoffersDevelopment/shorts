# Phase Summary Templates

> **Cel:** Kompaktowe podsumowania faz do przekazania kolejnym agentom (zamiast pełnych dokumentów)

---

## Phase 1: Brief Summary (~20 linii)

**Generowany przez:** ai-brief (po zatwierdzeniu)
**Lokalizacja:** `projects/{PROJECT}/brief/summary.md`
**Używany przez:** code-analyst, software-architect

```markdown
# Brief Summary: {Feature Name}

## Goal

[1-2 zdania - co budujemy]

## User Stories

- [najważniejsza 1]
- [najważniejsza 2]
- [najważniejsza 3]

## Key Requirements

- Backend: [lista 3-5 punktów]
- Frontend: [lista 3-5 punktów]

## Frontend Spec

- URL: `/[locale]/panel/business/{feature}`
- Navigation: [sekcja], icon: [nazwa]
- Pages: [lista]

## Database

- Models: [lista]
- Relations: [opis]

## Acceptance (P0)

- [ ] [kryterium 1]
- [ ] [kryterium 2]
- [ ] `npm run build` passes
```

---

## Phase 2: Analysis Summary (~25 linii)

**Generowany przez:** ai-analyze (po zatwierdzeniu)
**Lokalizacja:** `projects/{PROJECT}/analysis/summary.md`
**Używany przez:** software-architect, task-planner

```markdown
# Analysis Summary: {Feature Name}

## Reusable Components

| Component | Path                 | Reuse  |
| --------- | -------------------- | ------ |
| [Name]    | `src/components/...` | HIGH   |
| [Name]    | `src/components/...` | MEDIUM |

## Patterns Found

### Server Actions

- Pattern: Auth → Validate → Ownership → DB → revalidatePath
- Example: `src/app/actions/[domain]/create.ts`

### Forms

- React Hook Form + Zod
- Example: `src/components/[domain]/form.tsx`

## Database

- Extend: [Model1], [Model2]
- Create: [NewModel]

## Frontend Patterns

- Navigation: `src/components/panel/app-sidebar-client.tsx`
- Translations: `src/lib/locales/{pl,en,de,es,ru}/panel.json`
- Routing: `src/app/(main)/[locale]/panel/business/`
```

---

## Phase 3: Architecture Summary (~30 linii)

**Generowany przez:** ai-architect (po zatwierdzeniu)
**Lokalizacja:** `projects/{PROJECT}/architecture/summary.md`
**Używany przez:** task-planner, coder

````markdown
# Architecture Summary: {Feature Name}

## Database Schema

```prisma
model NewEntity {
  id        String   @id @default(cuid())
  // key fields only
}
```
````

## Server Actions

| Action | File                                 | Input → Output         |
| ------ | ------------------------------------ | ---------------------- |
| create | `src/app/actions/{domain}/create.ts` | `CreateInput → Entity` |
| update | `src/app/actions/{domain}/update.ts` | `UpdateInput → Entity` |

## Components

| Component | File                               | Type   |
| --------- | ---------------------------------- | ------ |
| Card      | `src/components/{domain}/card.tsx` | Client |
| Form      | `src/components/{domain}/form.tsx` | Client |
| Grid      | `src/components/{domain}/grid.tsx` | Client |

## Pages

| Page   | Path                        | Type   |
| ------ | --------------------------- | ------ |
| List   | `src/app/.../page.tsx`      | Server |
| Detail | `src/app/.../[id]/page.tsx` | Server |

## Navigation

- File: `src/components/panel/app-sidebar-client.tsx`
- Icon: `{IconName}` from lucide-react
- Label: `getText('navigation.{feature}', '{Label}')`

## Translations

Files: `src/lib/locales/{pl,en,de,es,ru}/panel.json`
Keys: `{feature}.title`, `{feature}.add`, `{feature}.edit`, etc.

````

---

## Phase 4: Tasks Summary (~20 linii)

**Generowany przez:** ai-plan-tasks (po zatwierdzeniu)
**Lokalizacja:** `projects/{PROJECT}/tasks/summary.md`
**Używany przez:** coder (dla kontekstu całości)

```markdown
# Tasks Summary: {Feature Name}

## Overview
- Total Tasks: {N}
- Split Tasks: {list or "none"}
- Estimated: {X} hours

## Task List
| ID | Name | Files | Tokens | Deps |
|----|------|-------|--------|------|
| 01 | Database Schema | 6 | ~6k | - |
| 02a | Backend | 8 | ~8k | 01 |
| 02b | Panel UI | 13 | ~13k | 02a |
| 02c | Public UI | 11 | ~11k | 02a |
| 03 | Navigation | 5 | ~5k | 02b,02c |

## Execution Order
1. task-01 → 2. task-02a → 3. task-02b → 4. task-02c → 5. task-03
````

---

## Per-Task Summary (~15 linii)

**Generowany przez:** ai-code-task (po zatwierdzeniu przez critic)
**Lokalizacja:** `projects/{PROJECT}/coding/task-XX/summary.md`
**Używany przez:** następny task, qa-tester

```markdown
# Task Summary: {Task ID} - {Name}

## Commit

SHA: `{commit_sha}`
Message: `{commit_message}`

## Files Changed

- Created: {list}
- Modified: {list}

## Key Implementations

- [Server Action/Component 1]: [brief description]
- [Server Action/Component 2]: [brief description]

## Dependencies Added

- [package]: [version] (if any)

## Next Task

Ready for: task-{next_id}
```

---

## Użycie w Komendach

### ai-brief (po success)

```bash
# Generate summary
Write: projects/{PROJECT}/brief/summary.md
```

### ai-analyze (input)

```bash
# Read summary instead of full brief
Read: projects/{PROJECT}/brief/summary.md
```

### ai-code-task (input for coder)

```bash
# Read compact context
Read: projects/{PROJECT}/architecture/summary.md
Read: projects/{PROJECT}/tasks/summary.md
Read: .ai-spec-flow/coding-practices-compact.md
```
