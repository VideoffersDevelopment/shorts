# Code Review: Task 07 - Iteration 1/3

**Commit:** 301c29cea04b3ffa1115f5e6049b9af46b039a71
**Verdict:** CHANGES REQUIRED

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | All 12 translation files updated (6 languages x 2 namespaces) | PASS | All files in commit: de, en, es, pl, ru, uk x feed.json, search.json |
| 2 | feed.json contains all keys: sort, filters, empty, loading, card | PASS | All required keys present in all 6 languages |
| 3 | search.json contains all keys: bar, suggestions, tabs, results, filters, loading | PASS | All required keys present in all 6 languages |
| 4 | i18n.ts updated to include feed and search namespaces | PASS | Already configured from earlier tasks (092628d) |
| 5 | All translations have proper Polish diacritics | FAIL | Polish uses ASCII-only characters |
| 6 | Russian and Ukrainian use Cyrillic characters | PASS | Proper Cyrillic used throughout |
| 7 | German uses proper umlauts | FAIL | German uses ASCII-only (no u, o, a) |
| 8 | Spanish uses proper accents | FAIL | Spanish uses ASCII-only (no a, e, i, o, u, n) |
| 9 | No missing translation keys | PASS | All keys present and consistent |
| 10 | JSON syntax is valid | PASS | All files parse correctly |
| 11 | npm run build passes | PASS | Build successful |

**Acceptance Criteria Result:** FAIL (3/11 criteria not met - special characters missing)

---

## Code Quality Issues

### 1. i18n: Polish translations missing diacritics

**Severity:** HIGH
**Files:**
- `src/lib/locales/pl/feed.json`
- `src/lib/locales/pl/search.json`

**Problem:** Polish translations use ASCII-only characters instead of proper Polish diacritics.

**Examples of incorrect text:**
| Current | Expected |
|---------|----------|
| "Wyczysc wszystkie" | "Wyczysc wszystkie" |
| "Lokalizacja" | "Lokalizacja" |
| "Wykryj lokalizacje" | "Wykryj lokalizacje" |
| "Caly kraj" | "Caly kraj" |
| "Kategorie" | "Kategorie" |
| "Wybierz kategorie..." | "Wybierz kategorie..." |
| "Ladowanie wiecej..." | "Ladowanie wiecej..." |
| "wyswietlen" | "wyswietlen" |
| "polubien" | "polubien" |
| "Szukaj shortow, firm, kategorii..." | "Szukaj shortow, firm, kategorii..." |
| "Wyczysc historie" | "Wyczysc historie" |
| "wynikow" | "wynikow" |

**Fix:** Update Polish translations with proper diacritics (a, e, l, o, s, z, z, c, n, A, E, L, O, S, Z, Z, C, N).

---

### 2. i18n: German translations missing umlauts

**Severity:** HIGH
**Files:**
- `src/lib/locales/de/feed.json`
- `src/lib/locales/de/search.json`

**Problem:** German translations use ASCII-only characters instead of proper German umlauts and eszett.

**Examples of incorrect text:**
| Current | Expected |
|---------|----------|
| "Fur dich" | "Fur dich" |
| "Alle loschen" | "Alle loschen" |
| "In der Nahe ({distance})" | "In der Nahe ({distance})" |
| "Kategorien auswahlen..." | "Kategorien auswahlen..." |
| "Ergebnisse fur \"{query}\"" | "Ergebnisse fur \"{query}\"" |
| "Versuche andere Schlusselworter oder uberprufe die Schreibweise" | "Versuche andere Schlusselworter oder uberprufe die Schreibweise" |
| "Verlauf loschen" | "Verlauf loschen" |

**Fix:** Update German translations with proper umlauts (a, o, u, A, O, U, ss).

---

### 3. i18n: Spanish translations missing accents

**Severity:** HIGH
**Files:**
- `src/lib/locales/es/feed.json`
- `src/lib/locales/es/search.json`

**Problem:** Spanish translations use ASCII-only characters instead of proper Spanish accents.

**Examples of incorrect text:**
| Current | Expected |
|---------|----------|
| "Mas recientes" | "Mas recientes" |
| "Ubicacion" | "Ubicacion" |
| "Detectar ubicacion" | "Detectar ubicacion" |
| "Todo el pais" | "Todo el pais" |
| "Categorias" | "Categorias" |
| "Seleccionar categorias..." | "Seleccionar categorias..." |
| "Maximo {max} categorias" | "Maximo {max} categorias" |
| "No hay shorts en esta area" | "No hay shorts en esta area" |
| "Aun no sigues a ninguna empresa" | "Aun no sigues a ninguna empresa" |
| "Busquedas recientes" | "Busquedas recientes" |
| "ortografia" | "ortografia" |

**Fix:** Update Spanish translations with proper accents (a, e, i, o, u, n, A, E, I, O, U, N).

---

## Summary

The implementation is structurally correct with all required keys present and proper JSON syntax. The build passes successfully. However, the translations for Polish, German, and Spanish languages use ASCII-only characters instead of their proper special characters (diacritics, umlauts, accents).

This is a HIGH severity issue for i18n quality as users will see incorrectly spelled words in their native languages.

### Required Changes

1. **Polish (pl):** Add Polish diacritics (a, e, l, o, s, z, z, c, n)
2. **German (de):** Add German umlauts and eszett (a, o, u, ss)
3. **Spanish (es):** Add Spanish accents and tilde (a, e, i, o, u, n)

**Note:** Russian (ru) and Ukrainian (uk) translations correctly use Cyrillic characters.
