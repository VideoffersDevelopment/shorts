# Etap {STAGE_NUMBER}: {STAGE_NAME}

**Projekt:** {PROJECT_NAME}
**Priorytet:** P0 (MVP) / P1 / P2
**Zależności:** {DEPENDENCIES}
**Szacowany czas:** {ESTIMATED_TIME}
**Status:** ⚪ Planowany / 🟡 W trakcie / 🟢 Ukończony

---

## 1. Cel Etapu

<!-- Jaki jest główny cel tego etapu? Co użytkownik zyska po jego wdrożeniu? -->

{STAGE_GOAL}

---

## 2. Funkcjonalności

### 2.1 {FEATURE_1_NAME}

**Opis:**
{FEATURE_DESCRIPTION}

**Co użytkownik może zrobić:**

- {ACTION_1}
- {ACTION_2}
- {ACTION_3}

### 2.2 {FEATURE_2_NAME}

**Opis:**
{FEATURE_DESCRIPTION}

**Co użytkownik może zrobić:**

- {ACTION_1}
- {ACTION_2}

<!-- Dodaj więcej funkcjonalności według potrzeb -->

---

## 3. User Stories

### US-{STAGE}-01: {STORY_TITLE}

**Jako** {ROLE}
**Chcę** {ACTION}
**Aby** {BENEFIT}

**Kryteria akceptacji:**

- [ ] {CRITERION_1}
- [ ] {CRITERION_2}

### US-{STAGE}-02: {STORY_TITLE}

**Jako** {ROLE}
**Chcę** {ACTION}
**Aby** {BENEFIT}

**Kryteria akceptacji:**

- [ ] {CRITERION_1}
- [ ] {CRITERION_2}

<!-- Dodaj więcej user stories według potrzeb -->

---

## 4. Wymagania Biznesowe

<!-- Zasady biznesowe, ograniczenia, walidacje - BEZ kodu! -->

### 4.1 Reguły Biznesowe

- {RULE_1}
- {RULE_2}
- {RULE_3}

### 4.2 Walidacje

- {VALIDATION_1}
- {VALIDATION_2}

### 4.3 Uprawnienia

| Akcja      | {ROLE_1} | {ROLE_2} | {ROLE_3} |
| ---------- | -------- | -------- | -------- |
| {ACTION_1} | ✅       | ❌       | ❌       |
| {ACTION_2} | ✅       | ✅       | ❌       |

---

## 5. Lokalizacja w Systemie

### 5.1 URL Pattern

| Strona    | URL                                             | Opis                |
| --------- | ----------------------------------------------- | ------------------- |
| Lista     | `/[locale]/panel/{section}/{feature}`           | Główna lista        |
| Szczegóły | `/[locale]/panel/{section}/{feature}/[id]`      | Widok szczegółów    |
| Tworzenie | `/[locale]/panel/{section}/{feature}/new`       | Formularz tworzenia |
| Edycja    | `/[locale]/panel/{section}/{feature}/[id]/edit` | Formularz edycji    |

### 5.2 Nawigacja

- **Sekcja menu:** {MENU_SECTION}
- **Ikona:** {ICON_NAME} (lucide-react)
- **Label:** {LABEL_PL} / {LABEL_EN}

### 5.3 User Flow

1. Użytkownik klika {MENU_ITEM} w sidebar
2. Widzi listę {ITEMS}
3. Klika "Dodaj nowy"
4. Wypełnia formularz
5. Zapisuje

---

## 6. Dane

### 6.1 Główne Encje (High Level)

<!-- Tylko nazwy i relacje - BEZ szczegółów schematu! -->

| Encja      | Opis          | Relacje               |
| ---------- | ------------- | --------------------- |
| {ENTITY_1} | {DESCRIPTION} | belongs to {ENTITY_X} |
| {ENTITY_2} | {DESCRIPTION} | has many {ENTITY_Y}   |

### 6.2 Kluczowe Pola

<!-- Tylko najważniejsze pola biznesowe - BEZ typów! -->

**{ENTITY_1}:**

- {FIELD_1} - {DESCRIPTION}
- {FIELD_2} - {DESCRIPTION}

---

## 7. Integracje

### 7.1 Wewnętrzne

<!-- Z jakimi innymi modułami/etapami się integruje? -->

- {MODULE_1} - {HOW}
- {MODULE_2} - {HOW}

### 7.2 Zewnętrzne

<!-- Jakie zewnętrzne serwisy są potrzebne? -->

- {SERVICE_1} - {PURPOSE}

---

## 8. Kryteria Akceptacji (Definition of Done)

### 8.1 Funkcjonalne

- [ ] {CRITERION_1}
- [ ] {CRITERION_2}
- [ ] {CRITERION_3}

### 8.2 Techniczne

- [ ] `npm run build` przechodzi bez błędów
- [ ] Tłumaczenia w {N} językach ({LANGUAGES})
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] Dark mode support

### 8.3 Jakościowe

- [ ] Code review passed
- [ ] Testy manualne passed
- [ ] UX review (opcjonalnie)

---

## 9. Out of Scope

<!-- Co NIE jest częścią tego etapu? -->

- {OUT_OF_SCOPE_1}
- {OUT_OF_SCOPE_2}

---

## 10. Pytania / Do Wyjaśnienia

<!-- Pytania do product ownera / stakeholderów -->

- [ ] {QUESTION_1}
- [ ] {QUESTION_2}

---

## Historia Zmian

| Data   | Opis                          | Autor    |
| ------ | ----------------------------- | -------- |
| {DATE} | Utworzenie specyfikacji etapu | {AUTHOR} |
