# AI Project Planner

System do tworzenia wysokopoziomowej specyfikacji projektu z podziałem na etapy.

**Obsługuje dokumenty źródłowe:** PRD, opisy działania, prompty od klientów.

---

## 🎯 Jak Używać - Szybki Start

### Masz gotowe dokumenty (PRD, opis)?

```bash
# 1. Dodaj dokumenty do projektu
/aio-source-add VideoShorts

# AI zapyta o:
# - Typ dokumentu (prd/opis/prompt)
# - Ścieżkę do pliku (np. .ai-prompts/PRD.md)
# - Krótki opis

# 2. Powtórz dla kolejnych dokumentów
/aio-source-add VideoShorts

# 3. Wygeneruj specyfikację
/aio-project-from-sources VideoShorts

# 4. Eksportuj etap do implementacji
/aio-stage-export VideoShorts 1
```

### Nie masz dokumentów? Utwórz przez rozmowę:

```bash
# 1. AI zada pytania i utworzy PRD
/aio-source-create MójProjekt --type=prd

# 2. (Opcjonalnie) Utwórz opis działania
/aio-source-create MójProjekt --type=opis

# 3. Wygeneruj specyfikację
/aio-project-from-sources MójProjekt
```

### Chcesz zacząć od zera bez źródeł?

```bash
# AI zada pytania i utworzy specyfikację
/aio-project-init MójProjekt --with-user
```

---

## 📚 Wszystkie Komendy

| Komenda                                 | Opis                                        |
| --------------------------------------- | ------------------------------------------- |
| `/aio-source-add <projekt>`             | Dodaj istniejący dokument do źródeł         |
| `/aio-source-create <projekt> --type=X` | Utwórz dokument przez rozmowę z AI          |
| `/aio-project-from-sources <projekt>`   | Wygeneruj specyfikację z dokumentów         |
| `/aio-project-init <projekt>`           | Inicjalizuj projekt od zera                 |
| `/aio-project-spec`                     | Rozwiń specyfikację projektu                |
| `/aio-sources-list <projekt>`           | Pokaż listę źródeł                          |
| `/aio-stages-list <projekt>`            | Pokaż listę etapów                          |
| `/aio-stage-export <projekt> <nr>`      | Przygotuj etap do eksportu                  |
| `/aio-verify <projekt>`                 | **Weryfikuj zgodność ze źródłami i jakość** |

### Typy dokumentów (`--type=`)

| Typ      | Kiedy używać                                        |
| -------- | --------------------------------------------------- |
| `prd`    | Masz specyfikację techniczną, wymagania, stack      |
| `opis`   | Masz opis dla klienta, user flows, scenariusze      |
| `prompt` | Masz surowy tekst (email, notatki) do przetworzenia |

---

## 🔄 Pełny Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              DOKUMENTY ŹRÓDŁOWE (sources/)                   │
│         PRD, opisy działania, prompty od klientów            │
│         /aio-source-add lub /aio-source-create               │
└─────────────────────────────────────────────────────────────┘
                            ↓
              /aio-project-from-sources
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AI PROJECT PLANNER (ten system)                 │
│         Wysokopoziomowa specyfikacja całego projektu         │
│         BEZ KODU - tylko opis biznesowy                      │
│         stage-01/spec.md = SINGLE SOURCE OF TRUTH            │
└─────────────────────────────────────────────────────────────┘
                            ↓
              /ai-import-stage Projekt 1  ← NOWE!
              (pomija Brief, używa spec.md)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI SPEC FLOW                              │
│         Wdrożenie pojedynczego etapu                         │
│         Analyze → Architect → Tasks → Code                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Szczegółowy Workflow

### Ścieżka A: Z Dokumentów Źródłowych (ZALECANA)

Gdy masz PRD, opisy działania lub prompty od klienta.

#### Faza 0: Dodanie Źródeł

**Komenda:** `/aio-source-add <nazwa-projektu>`

Dodaje istniejący dokument (PRD, opis) do projektu.

**Komenda:** `/aio-source-create <nazwa-projektu>` [--type=prd|opis|prompt]

Tworzy nowy dokument przez rozmowę z AI.

#### Faza 1: Generowanie Specyfikacji

**Komenda:** `/aio-project-from-sources <nazwa-projektu>`

Analizuje źródła i generuje:

- `project-spec.md` (główna specyfikacja)
- `architecture-plan.md` (planowana architektura)
- `stages/` (podział na etapy)

#### Faza 2: Eksport do AI Spec Flow

**Automatyczny import (ZALECANE):**

```bash
/ai-import-stage VideoShorts 1
```

AI automatycznie:

- Importuje spec.md do Spec Flow jako brief.md
- Importuje project-spec.md i architecture-plan.md do context/
- Pomija fazę Brief
- Przechodzi od razu do `/ai-analyze` z pełnym kontekstem

**Alternatywnie (ręcznie):**

1. Otwórz `stages/stage-NN/spec.md`
2. Skopiuj zawartość
3. Uruchom `/ai-brief` w AI Spec Flow
4. Wklej jako opis funkcji

---

### Ścieżka B: Od Zera (bez źródeł)

Gdy zaczynasz projekt bez dokumentacji.

#### Faza 1: Inicjalizacja Projektu

**Komenda:** `/aio-project-init <nazwa-projektu>` [--with-user]

Tworzy szkielet projektu:

- `project-spec.md` (główna specyfikacja)
- `architecture-plan.md` (planowana architektura)
- `stages/index.md` (lista etapów)

**Tryby:**

- `--with-user` - AI zadaje pytania przed utworzeniem
- Bez flagi - AI tworzy szkielet automatycznie

#### Faza 2: Tworzenie Specyfikacji

**Komenda:** `/aio-project-spec` [--with-user]

Rozwija specyfikację:

- Definiuje moduły systemu
- Dzieli na etapy wdrożenia
- Określa zależności między etapami

#### Faza 3: Eksport do AI Spec Flow

**Automatyczny import:**

```bash
/ai-import-stage MójProjekt 1
```

**Alternatywnie (ręcznie):**

1. Otwórz `stages/stage-NN/spec.md`
2. Skopiuj zawartość
3. Uruchom `/ai-brief` w AI Spec Flow
4. Wklej jako opis funkcji

---

## 📁 Struktura Projektu

```
.ai-project-planner/
├── README.md                      # Ten plik
├── coding-practices-universal.md  # Uniwersalne praktyki (do kopiowania)
├── templates/
│   ├── project-spec.md            # Szablon specyfikacji
│   ├── stage.md                   # Szablon etapu
│   └── architecture-plan.md       # Szablon architektury
├── sources/                       # DOKUMENTY ŹRÓDŁOWE
│   ├── README.md                  # Instrukcja użycia sources
│   ├── templates/
│   │   ├── prd-template.md        # Szablon PRD
│   │   ├── opis-template.md       # Szablon opisu działania
│   │   ├── prompt-template.md     # Szablon dla surowego prompta
│   │   └── sources-index.template.json
│   └── {PROJECT_NAME}/            # Źródła dla projektu
│       ├── source-01-prd.md       # PRD
│       ├── source-02-opis.md      # Opis działania
│       └── sources-index.json     # Metadane źródeł
└── projects/
    └── {PROJECT_NAME}/
        ├── project-spec.md        # Główna specyfikacja
        ├── architecture-plan.md   # Planowana architektura
        ├── sources-ref.json       # Referencje do źródeł
        ├── stages/
        │   ├── index.md           # Lista etapów + status
        │   ├── stage-01-{name}/
        │   │   ├── spec.md        # Opis etapu
        │   │   └── status.json    # Status (draft/ready/exported)
        │   ├── stage-02-{name}/
        │   │   └── ...
        │   └── ...
        └── progress.json          # Stan projektu
```

---

## 📝 Format Specyfikacji

### Główna Specyfikacja (`project-spec.md`)

```markdown
# {Nazwa Projektu} - Specyfikacja

## 1. Wizja Produktu

- Problem
- Rozwiązanie
- Użytkownicy

## 2. Moduły Systemu

- Moduł A (priorytet, etap)
- Moduł B (priorytet, etap)

## 3. Architektura (High Level)

- Warstwy
- Główne encje
- Integracje

## 4. Etapy Wdrożenia

- Tabela etapów z zależnościami

## 5. Wymagania Niefunkcjonalne

- Wydajność, skalowalność, i18n
```

### Specyfikacja Etapu (`stages/stage-NN/spec.md`)

```markdown
# Etap N: {Nazwa}

## 1. Cel Etapu

## 2. Funkcjonalności

## 3. User Stories

## 4. Wymagania Biznesowe

## 5. Lokalizacja w Systemie (URL, menu)

## 6. Kryteria Akceptacji
```

**WAŻNE:** Specyfikacja etapu NIE zawiera kodu - tylko opis biznesowy!

---

## 🔗 Integracja z AI Spec Flow

### Kiedy używać Project Planner vs Spec Flow?

| Scenariusz                       | Użyj                                  |
| -------------------------------- | ------------------------------------- |
| Masz PRD/opis od klienta         | Sources → Project Planner → Spec Flow |
| Nowy projekt od zera             | Project Planner → potem Spec Flow     |
| Nowa duża funkcja (wiele etapów) | Project Planner → potem Spec Flow     |
| Mała funkcja (1 etap)            | Bezpośrednio Spec Flow                |
| Bug fix / refactor               | Bezpośrednio Spec Flow                |

### Przepływ Pracy (z dokumentami źródłowymi)

```
1. /aio-source-add "VideoShorts"
   → Dodajesz PRD z .ai-prompts/
   → Dodajesz opis działania

2. /aio-project-from-sources "VideoShorts"
   → AI analizuje źródła
   → Generuje project-spec.md
   → Dzieli na etapy

3. Ręcznie kopiujesz stage-01/spec.md do AI Spec Flow:
   /ai-brief "Etap 1: [opis z spec.md]"

4. Po wdrożeniu etapu 1, kopiujesz etap 2, itd.
```

### Przepływ Pracy (od zera)

```
1. /aio-project-init "Mój Projekt" --with-user
   → Odpowiadasz na pytania
   → Powstaje project-spec.md

2. /aio-project-spec --with-user
   → Definiujesz moduły
   → System dzieli na etapy

3. Ręcznie kopiujesz stage-01/spec.md do AI Spec Flow:
   /ai-brief "Etap 1: [opis z spec.md]"

4. Po wdrożeniu etapu 1, kopiujesz etap 2, itd.
```

---

## 📚 Coding Practices

### Uniwersalne (`coding-practices-universal.md`)

Zawiera ogólne praktyki do wykorzystania w każdym projekcie:

- TypeScript strict mode
- React best practices
- Zod validation patterns
- Server Actions pattern
- i18n pattern

**Użycie:** Kopiujesz do nowego projektu jako bazę `coding-practices.md`

### Projektowe (w AI Spec Flow)

Po wdrożeniu pierwszego etapu, `coding-practices.md` ewoluuje z:

- Wzorcami specyficznymi dla projektu
- Istniejącymi komponentami
- Domain-specific patterns

---

## ⚠️ Ważne Zasady

1. **BEZ KODU** - specyfikacja jest opisowa, bez implementacji
2. **Etapy sekwencyjne** - każdy etap ma zależności
3. **Ręczny eksport** - świadomie decydujesz kiedy wdrażać
4. **Ewolucja** - specyfikacja może się zmieniać w trakcie projektu
5. **Źródła są read-only** - po dodaniu nie modyfikuj dokumentów źródłowych
6. **Jeden projekt = jeden folder** - wszystkie źródła projektu w jednym miejscu

---

## 🤖 Agenci i Skille

### Agenci (przetwarzanie)

| Agent             | Rola                           |
| ----------------- | ------------------------------ |
| `source-analyzer` | Analizuje dokumenty źródłowe   |
| `project-analyst` | Tworzy project-spec.md         |
| `stage-planner`   | Dzieli na etapy                |
| `project-critic`  | Weryfikuje jakość specyfikacji |
| `source-guardian` | Pilnuje zgodności ze źródłami  |

### Skille (pilnowanie źródeł)

| Skill              | Opis                                        |
| ------------------ | ------------------------------------------- |
| `source-alignment` | Sprawdza zgodność z PRD przed każdą zmianą  |
| `scope-guard`      | Blokuje funkcje spoza dokumentów źródłowych |

### Weryfikacja

```bash
# Sprawdź zgodność ze źródłami
/aio-verify VideoShorts

# Pełna weryfikacja (źródła + jakość)
/aio-verify VideoShorts --mode=full
```

---

## 📍 Gdzie Są Pliki?

| Co       | Gdzie                                     |
| -------- | ----------------------------------------- |
| Komendy  | `.claude/commands/aio-*.md`               |
| Agenci   | `.claude/agents/subagent_*.md`            |
| Skille   | `.claude/skills/*.md`                     |
| Szablony | `.ai-project-planner/templates/`          |
| Źródła   | `.ai-project-planner/sources/{PROJEKT}/`  |
| Projekty | `.ai-project-planner/projects/{PROJEKT}/` |
