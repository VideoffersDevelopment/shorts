# Etapy Projektu: VideoShorts

**Projekt:** VideoShorts - Platforma SaaS dla krótkich filmów promocyjnych firm
**Wersja:** 1.0
**Data:** 2025-11-28

---

## Przegląd Etapów

| # | Nazwa | Priorytet | Zależności | Szacowany Czas | Status |
|---|-------|-----------|------------|----------------|--------|
| 1 | Core + Auth | P0 (Critical) | - | 2-3 tygodnie | ⚪ Planowany |
| 2 | Companies + Verification | P0 (Critical) | Etap 1 | 2 tygodnie | ⚪ Planowany |
| 3 | Shorts Upload + Payments | P0 (Critical) | Etap 1, 2 | 3 tygodnie | ⚪ Planowany |
| 4 | Feed + Discovery | P0 (Critical) | Etap 3 | 2-3 tygodnie | ⚪ Planowany |
| 5 | Interactions | P1 (High) | Etap 4 | 2 tygodnie | ⚪ Planowany |
| 6 | Moderation | P1 (High) | Etap 5 | 1-2 tygodnie | ⚪ Planowany |
| 7 | Analytics | P1 (High) | Etap 3, 4 | 2 tygodnie | ⚪ Planowany |
| 8 | Notifications + Lifecycle | P1 (High) | Etap 3, 5 | 1-2 tygodnie | ⚪ Planowany |

**Szacowany czas realizacji MVP (Etapy 1-4):** 9-11 tygodni
**Szacowany czas realizacji Post-MVP (Etapy 5-8):** 6-8 tygodni
**Łączny czas projektu:** 15-19 tygodni (3.5-4.5 miesiąca)

---

## Legenda Statusów

- ⚪ **Planowany** - Specyfikacja gotowa, czeka na rozpoczęcie
- 🟡 **W trakcie** - Eksportowany do AI Spec Flow, w implementacji
- 🟢 **Ukończony** - Wdrożony na staging/production
- 🔴 **Zablokowany** - Czeka na zakończenie zależności

---

## Graf Zależności

```
Etap 1: Core + Auth
    │
    ├──> Etap 2: Companies + Verification
    │        │
    │        └──> Etap 3: Shorts Upload + Payments
    │                  │
    │                  ├──> Etap 4: Feed + Discovery
    │                  │        │
    │                  │        └──> Etap 5: Interactions
    │                  │                  │
    │                  │                  ├──> Etap 6: Moderation
    │                  │                  │
    │                  │                  └──> Etap 8: Notifications + Lifecycle
    │                  │
    │                  └──> Etap 7: Analytics
```

---

## Kamienie Milowe

### Milestone 1: MVP Foundation (Etapy 1-2)
**Termin:** Tydzień 5
**Deliverables:**
- Działająca autentykacja (email + OAuth)
- Profile użytkowników i firm
- Weryfikacja VIES
- Panel administratora (podstawy)

### Milestone 2: MVP Core Features (Etapy 3-4)
**Termin:** Tydzień 11
**Deliverables:**
- Upload i publikacja shortsów (R2 + Qencode)
- Integracja payment providers (Przelewy24, Tpay)
- Feed z filtrowaniem i wyszukiwaniem
- Mobile-responsive UI

### Milestone 3: MVP Launch
**Termin:** Tydzień 11
**Kryteria:**
- [ ] Wszystkie funkcje P0 wdrożone
- [ ] Testy E2E przechodzą
- [ ] Performance budget spełniony (LCP < 2s)
- [ ] Security audit zaliczony
- [ ] 10 testowych firm onboardowanych

### Milestone 4: Post-MVP (Etapy 5-8)
**Termin:** Tydzień 19
**Deliverables:**
- System reakcji i komentarzy
- Moderacja automatyczna + manualna
- Dashboard analytics
- Powiadomienia email + in-app

---

## Definition of Done (DoD) dla Każdego Etapu

Każdy etap uważa się za ukończony, gdy:

### 1. Kod
- [ ] Wszystkie user stories zaimplementowane
- [ ] Code review wykonany i zaaprobowany
- [ ] Testy jednostkowe napisane (coverage > 70%)
- [ ] Testy integracyjne dla krytycznych ścieżek
- [ ] ESLint i TypeScript bez błędów
- [ ] Prisma migrations stworzone i przetestowane

### 2. Dokumentacja
- [ ] API endpoints udokumentowane (OpenAPI/Swagger)
- [ ] Komponenty React udokumentowane (Storybook - opcjonalne w MVP)
- [ ] README zaktualizowane (setup instructions)
- [ ] Environment variables dodane do `.env.example`

### 3. Jakość
- [ ] Manual testing wykonany
- [ ] Acceptance criteria spełnione
- [ ] Bug-free (no critical/major bugs)
- [ ] Performance requirements spełnione
- [ ] Accessibility (WCAG AA) dla UI

### 4. Deployment
- [ ] Deployed na staging i przetestowany
- [ ] Database migrations uruchomione
- [ ] Environment variables ustawione
- [ ] Smoke tests na staging przeszły

### 5. Stakeholder Review
- [ ] Product Owner zaakceptował funkcjonalności
- [ ] UX/UI feedback zaadresowany
- [ ] Security concerns rozwiązane

---

## Jak Eksportować Etap do AI Spec Flow

Gdy etap jest gotowy do implementacji:

### Krok 1: Przygotuj Specyfikację
1. Otwórz `stages/stage-XX-{name}/spec.md`
2. Przeczytaj sekcje 1-6 (bez historii zmian)
3. Upewnij się, że wszystkie zależności są spełnione

### Krok 2: Uruchom AI Spec Flow
1. Otwórz projekt w nowym oknie Claude Code
2. Uruchom `/ai-brief` (interactive mode)
3. Wklej opis projektu z sekcji 1-4 stage spec
4. Odpowiedz na pytania AI dotyczące:
   - User stories (sekcja 3)
   - Technical requirements (sekcja 5)
   - Dependencies (sekcja 8)

### Krok 3: Aktualizuj Status
1. Zmień status etapu w tym pliku na 🟡 **W trakcie**
2. Commituj zmianę: `git commit -m "Start Etap X: {name}"`

### Krok 4: Tracking
- Aktualizuj status w miarę postępu
- Gdy etap jest ukończony:
  - Zmień status na 🟢 **Ukończony**
  - Dodaj link do PR/release notes
  - Zaktualizuj `spec.md` z faktycznymi datami

---

## Strategia Testowania

### Etapy 1-2 (Foundation)
**Focus:** Integration tests dla auth flow
- Testy rejestracji/logowania
- OAuth flow (Google, Facebook)
- Session management
- VIES API integration

### Etapy 3-4 (Core MVP)
**Focus:** E2E tests dla user journeys
- Upload → payment → publish flow
- Feed browsing z filtrowaniem
- Search functionality
- Video playback

### Etapy 5-8 (Post-MVP)
**Focus:** Edge cases i error handling
- Spam prevention (rate limiting)
- Moderation workflow
- Background jobs (Inngest)
- Email delivery

### Tools
- **Unit:** Vitest
- **Integration:** Vitest + Prisma test helpers
- **E2E:** Playwright
- **API:** Supertest lub Playwright API testing

---

## Ryzyka i Mitygacje

### Wysokie Ryzyko

| Ryzyko | Etap | Mitygacja |
|--------|------|-----------|
| R2/Qencode failures powodują blokadę publishingu | 3 | Retry logic w Inngest, graceful degradation, status page, qencode status polling |
| Payment provider webhook delivery failures | 3 | Idempotency keys per provider, manual reconciliation tool, monitoring alerts |
| VIES API downtime (EU public service) | 2 | Fallback do manual verification, cache results |
| Perspective API rate limits | 6 | Batch processing, fallback do auto-approve + manual review |
| Database performance w feed queries | 4 | Proper indexes, query optimization, consider caching layer |

### Średnie Ryzyko

| Ryzyko | Etap | Mitygacja |
|--------|------|-----------|
| OAuth provider outages | 1 | Fallback do email/password, multi-provider support |
| Geolocation accuracy (Mapbox) | 4 | Allow manual location override, fuzzy radius search |
| Video transcode time > expected (Qencode) | 3 | Set expectations (notify user), progress indicator, polling status |
| Spam/abuse (comments, uploads) | 6 | Rate limiting, CAPTCHA, admin tools |

---

## Komunikacja i Raportowanie

### Weekly Sync (Piątki, 10:00)
- Review completed tasks
- Demo funkcjonalności
- Identyfikacja blockerów
- Planning na kolejny tydzień

### Progress Tracking
- GitHub Projects board
- Slack updates (daily standup)
- Staging deploys (continuous)

### Stakeholder Updates (Co 2 tygodnie)
- Executive summary (status, risks, blockers)
- Live demo na staging
- Feedback session

---

## Kontakty i Zasoby

### Dokumentacja Techniczna
- **Project Spec:** `.ai-project-planner/projects/videoshorts/project-spec.md`
- **Architecture Plan:** `.ai-project-planner/projects/videoshorts/architecture-plan.md`
- **API Docs:** (TBD - Swagger/OpenAPI)

### External Services Docs
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Qencode API Docs](https://docs.qencode.com/)
- [Vidstack Player Docs](https://www.vidstack.io/docs)
- [Przelewy24 Docs](https://docs.przelewy24.pl/)
- [Tpay Docs](https://tpay.com/dokumentacja)
- [Mapbox Docs](https://docs.mapbox.com/)
- [Perspective API](https://perspectiveapi.com/)
- [NextAuth.js Docs](https://authjs.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostHog Docs](https://posthog.com/docs)

### Support
- **Tech Lead:** [TBD]
- **Product Owner:** [TBD]
- **DevOps:** Vercel Support

---

**Ostatnia aktualizacja:** 2025-12-30
**Aktualizował:** AI Project Modifier (Mux → R2 + Qencode migration)
