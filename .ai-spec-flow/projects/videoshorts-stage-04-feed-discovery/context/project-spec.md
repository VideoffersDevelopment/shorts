# VideoShorts - Specyfikacja Projektu (Reference)

> **ŹRÓDŁO:** `.ai-project-planner/projects/videoshorts/project-spec.md`
> **Import:** 2026-01-01
> **Typ:** Context Reference

---

<!--
  Ten plik jest referencją do pełnej specyfikacji projektu VideoShorts.
  Zawiera informacje o wszystkich modułach, typach użytkowników i wymaganiach.

  Dla pełnej specyfikacji zobacz źródło powyżej.
-->

## Podsumowanie Projektu

VideoShorts to platforma SaaS umożliwiająca firmom publikację krótkich filmów promocyjnych (do 60 sekund) w formacie vertical video (9:16). System działa na modelu pay-per-video, gdzie firmy płacą za publikację każdego shorta przez elastyczny system płatności z wieloma providerami (obecnie: Przelewy24, Tpay).

### Kluczowe Moduły:

| Moduł | Opis | Etap |
|-------|------|------|
| Authentication & Users | Rejestracja, logowanie, profile | Etap 1 |
| Companies | Profile firmowe, weryfikacja VIES | Etap 2 |
| Shorts Upload + Payments | Video pipeline, Qencode, płatności | Etap 3 |
| **Feed + Discovery** | Feed, filtry, sortowanie, wyszukiwanie | **Etap 4** |
| Interactions | Likes, komentarze, follows | Etap 5 |
| Moderation | Raporty, moderacja, audit log | Etap 6 |
| Analytics | Dashboard firmy, statystyki | Etap 7 |
| Notifications + Lifecycle | Email, in-app, archiwizacja | Etap 8 |

### Typy Użytkowników:

1. **User (Przeglądający)** - Przeglądanie, reakcje, komentarze
2. **Company (Firma)** - Publikowanie shortsów, dostęp do analytics
3. **Admin** - Moderacja, zarządzanie platformą

### Wymagania Niefunkcjonalne:

- Feed load time < 2s (LCP)
- 95% uptime (MVP)
- OWASP Top 10 compliance
- Mobile-first responsive design
- GDPR/RODO compliance

---

**Pełna specyfikacja:** `.ai-project-planner/projects/videoshorts/project-spec.md`
