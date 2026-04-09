# {PROJECT_NAME} - Specyfikacja Projektu

**Wersja:** 1.0
**Data utworzenia:** {DATE}
**Ostatnia aktualizacja:** {DATE}

---

## 1. Wizja Produktu

### 1.1 Problem

<!-- Jaki problem rozwiązuje ten projekt? Co nie działa obecnie? -->

{PROBLEM_DESCRIPTION}

### 1.2 Rozwiązanie

<!-- Jak projekt rozwiązuje ten problem? Jaka jest główna wartość? -->

{SOLUTION_DESCRIPTION}

### 1.3 Użytkownicy

<!-- Kto będzie używał systemu? Jakie są główne role? -->

| Rola     | Opis          | Kluczowe potrzeby |
| -------- | ------------- | ----------------- |
| {ROLE_1} | {DESCRIPTION} | {NEEDS}           |
| {ROLE_2} | {DESCRIPTION} | {NEEDS}           |

### 1.4 Cele Biznesowe

<!-- Jakie są mierzalne cele projektu? -->

- [ ] {GOAL_1}
- [ ] {GOAL_2}
- [ ] {GOAL_3}

---

## 2. Moduły Systemu

### 2.1 {MODULE_1_NAME}

**Priorytet:** P0 (MVP) / P1 / P2
**Etap:** {STAGE_NUMBER}
**Zależności:** {DEPENDENCIES}

**Opis:**
{MODULE_DESCRIPTION}

**Główne funkcjonalności:**

- {FEATURE_1}
- {FEATURE_2}
- {FEATURE_3}

### 2.2 {MODULE_2_NAME}

**Priorytet:** P0 / P1 / P2
**Etap:** {STAGE_NUMBER}
**Zależności:** {DEPENDENCIES}

**Opis:**
{MODULE_DESCRIPTION}

**Główne funkcjonalności:**

- {FEATURE_1}
- {FEATURE_2}

<!-- Dodaj więcej modułów według potrzeb -->

---

## 3. Architektura (High Level)

### 3.1 Stack Technologiczny

| Warstwa  | Technologia                | Uwagi                         |
| -------- | -------------------------- | ----------------------------- |
| Frontend | Next.js 15, React 19       | App Router, Server Components |
| Styling  | TailwindCSS, shadcn/ui     |                               |
| Backend  | Server Actions, API Routes |                               |
| Database | PostgreSQL, Prisma         |                               |
| Auth     | NextAuth.js / Clerk        |                               |
| Storage  | Cloudinary / S3            |                               |
| CMS      | Payload CMS (opcjonalnie)  |                               |

### 3.2 Główne Encje

<!-- Lista głównych modeli danych - BEZ szczegółów implementacji -->

| Encja      | Opis          | Relacje     |
| ---------- | ------------- | ----------- |
| {ENTITY_1} | {DESCRIPTION} | {RELATIONS} |
| {ENTITY_2} | {DESCRIPTION} | {RELATIONS} |

### 3.3 Integracje Zewnętrzne

<!-- Jakie zewnętrzne serwisy będą używane? -->

| Integracja      | Cel       | Etap    |
| --------------- | --------- | ------- |
| {INTEGRATION_1} | {PURPOSE} | {STAGE} |

---

## 4. Etapy Wdrożenia

### Przegląd Etapów

| #   | Nazwa          | Priorytet | Zależności | Szacowany czas | Status       |
| --- | -------------- | --------- | ---------- | -------------- | ------------ |
| 1   | {STAGE_1_NAME} | P0        | -          | {TIME}         | ⚪ Planowany |
| 2   | {STAGE_2_NAME} | P0        | Etap 1     | {TIME}         | ⚪ Planowany |
| 3   | {STAGE_3_NAME} | P1        | Etap 2     | {TIME}         | ⚪ Planowany |

### Legenda Statusów

- ⚪ Planowany - jeszcze nie rozpoczęty
- 🟡 W trakcie - aktualnie wdrażany w AI Spec Flow
- 🟢 Ukończony - wdrożony i przetestowany
- 🔴 Zablokowany - czeka na zależności

---

## 5. Wymagania Niefunkcjonalne

### 5.1 Wydajność

- Response time: < {X}ms
- Time to First Byte: < {X}ms
- Largest Contentful Paint: < {X}s

### 5.2 Skalowalność

- Docelowa liczba użytkowników: {X}
- Docelowa liczba rekordów: {X}

### 5.3 Dostępność

- Uptime: {X}%
- Backup: {FREQUENCY}

### 5.4 Internacjonalizacja (i18n)

- Języki: {LANGUAGES}
- RTL support: Tak / Nie

### 5.5 Responsywność

- Mobile-first: Tak / Nie
- Breakpoints: sm, md, lg, xl, 2xl

### 5.6 Bezpieczeństwo

- Autentykacja: {METHOD}
- Autoryzacja: {METHOD}
- HTTPS: Wymagane

---

## 6. Ograniczenia i Założenia

### 6.1 Ograniczenia

<!-- Co NIE jest częścią tego projektu? -->

- {CONSTRAINT_1}
- {CONSTRAINT_2}

### 6.2 Założenia

<!-- Jakie założenia przyjmujemy? -->

- {ASSUMPTION_1}
- {ASSUMPTION_2}

---

## 7. Ryzyka

| Ryzyko   | Prawdopodobieństwo     | Wpływ               | Mitygacja    |
| -------- | ---------------------- | ------------------- | ------------ |
| {RISK_1} | Niskie/Średnie/Wysokie | Niski/Średni/Wysoki | {MITIGATION} |

---

## 8. Harmonogram (Opcjonalnie)

| Etap      | Data rozpoczęcia | Data zakończenia |
| --------- | ---------------- | ---------------- |
| {STAGE_1} | {DATE}           | {DATE}           |
| {STAGE_2} | {DATE}           | {DATE}           |

---

## Historia Zmian

| Data   | Wersja | Opis zmian           | Autor    |
| ------ | ------ | -------------------- | -------- |
| {DATE} | 1.0    | Utworzenie dokumentu | {AUTHOR} |
