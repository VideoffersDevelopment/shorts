# Audyt wdrożenia: Etap 2 — Companies + Verification

**Data audytu:** 2026-04-08
**Spec:** `.ai-project-planner/projects/videoshorts/stages/stage-02-companies/spec.md`

---

## Podsumowanie

| Metryka            | Wartość |
| ------------------ | ------- |
| W pełni wdrożone   | ~80%    |
| Częściowo wdrożone | ~15%    |
| Nie wdrożone       | ~5%     |

---

## W pełni wdrożone

- [x] Model CompanyProfile (ulepszony: enum CompanyStatus, split address, contactEmail)
- [x] Model Category (zgodność ze spec)
- [x] Model AuditLog + migracje
- [x] Upgrade do konta firmowego (server action, walidacja NIP, VIES check)
- [x] Klient VIES API (`src/lib/vies.ts` — SOAP, retry, backoff)
- [x] Publiczny profil firmy `/companies/[slug]` (SEO, responsywny)
- [x] Upload logo/banner (R2, presigned URLs)
- [x] Kategorie CRUD (server actions + tree UI w `/admin/categories`)
- [x] Admin layout + sidebar z i18n
- [x] Admin dashboard (realne statystyki)
- [x] Admin — zarządzanie firmami (DataTable, filtry, verify/reject/delete)
- [x] Admin — zarządzanie userami (DataTable, filtry, rola, blokowanie)
- [x] Audit logging — backend (wszystkie akcje adminów logowane do DB)
- [x] Email notifications (verify, reject, delete)
- [x] Edycja profilu firmy — strona `/panel/company/profile`
- [x] Panel firmy — strona `/panel/company/overview`

---

## Częściowo wdrożone

- [ ] **Seed kategorii** — jest 3 kategorie główne + 9 podkategorii, spec wymaga **minimum 10 kategorii głównych**
- [ ] **Edytor Markdown** — rendering działa (react-markdown), ale edycja to zwykły `<Textarea>` zamiast edytora z podglądem
- [ ] **Lokalizacja** — Nominatim/Leaflet zamiast Mapbox (funkcjonalnie OK, odbiega od spec)

---

## Nie wdrożone

- [ ] **Strona `/admin/audit`** — link w sidebarze istnieje, dane w DB, brak UI (AuditLogViewer)
- [ ] **Drag & drop reorder kategorii** — pole `order` w DB istnieje, brak UI do zmiany kolejności
- [ ] **VIES re-verification cron** — brak Inngest function do cyklicznej re-weryfikacji co 6 miesięcy

---

## Dodatkowe funkcje (poza specyfikacja)

- CompanyStatus enum (PENDING/ACTIVE/SUSPENDED) zamiast boolean
- Rozszerzone social links (YouTube, LinkedIn)
- Split address (street/postalCode/city)
- Admin company edit page `/admin/companies/[id]/edit`
- Bulk admin actions (firmy + userzy)
- Promo credits on upgrade (integracja z portfelem)
- NIP public validation (real-time)
- Admin pricing + wallet (z późniejszych etapów)

---

## Rekomendowana kolejność działań

1. **Strona `/admin/audit`** — dane gotowe w DB, potrzeba komponentu AuditLogViewer
2. **Rozszerzenie seed kategorii** — dodać brakujące 7+ kategorii głównych
3. **Cron VIES re-verification** — Inngest function (co 6 miesięcy)
4. **Reorder kategorii** — drag & drop lub proste UI do zmiany `order`
5. **Markdown editor** — zamiana `<Textarea>` na edytor z podglądem
