# Kontekst: Plan Architektury VideoShorts

> **ŹRÓDŁO:** `.ai-project-planner/projects/videoshorts/architecture-plan.md`
> **Typ:** Referencja do planu architektury projektu

---

Ten plik jest referencją do planu architektury projektu VideoShorts.

**Pełny plan architektury znajduje się w:**
```
.ai-project-planner/projects/videoshorts/architecture-plan.md
```

## Jak używać tego kontekstu

Podczas faz Architecture i Tasks, AI powinno przeczytać pełny plan architektury aby:

1. **Stosować określony stack** - Next.js 14+, Prisma, NextAuth, shadcn/ui, etc.
2. **Zachować strukturę projektu** - folder structure, naming conventions
3. **Rozumieć przepływy danych** - video upload flow, feed generation, etc.
4. **Implementować bezpieczeństwo** - auth, validation, rate limiting zgodnie z planem
5. **Skalować zgodnie z planem** - caching, CDN, background jobs (Inngest)

## Kluczowe sekcje w architecture-plan.md

- **Architektura Wysokiego Poziomu** - diagram warstw (Client, API, Data, External Services)
- **Stack Technologiczny** - szczegółowa lista technologii
- **Struktura Bazy Danych** - pełny Prisma schema
- **Struktura API** - wszystkie endpoints
- **Struktura Projektu Next.js** - folder structure
- **Przepływy Danych** - video upload, feed generation, moderation
- **Bezpieczeństwo** - auth, validation, rate limiting
- **Deployment Strategy** - environments, CI/CD, migrations

---

**INSTRUKCJA:** Przed każdą fazą przeczytaj pełny plan architektury w pliku źródłowym.
