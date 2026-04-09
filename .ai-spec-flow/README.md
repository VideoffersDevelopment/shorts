# AI Spec Flow - System Workflow dla AI-Assisted Development

> **Wersja:** 1.0
> **Data utworzenia:** 2025-11-23
> **Projekt:** Papitto - Dog Breeders Platform

## 🎯 Przegląd

**AI Spec Flow** to kompletny system workflow dla rozwoju oprogramowania z asystą AI, zapewniający:

- **Pełną kontrolę użytkownika** między fazami
- **Ewoluujące praktyki kodowania** (self-improving system)
- **Git-native approach** z branch isolation
- **Frontend awareness** wbudowane w planowanie
- **Audit trail** każdego kroku
- **Resume capability** z dowolnego punktu

## 📋 Fazy Workflow

```
1. BRIEF → 2. ANALYSIS → 3. ARCHITECTURE → 4. TASK PLANNING → 5. CODING → 6. TESTING
   ↓           ↓             ↓                 ↓                 ↓           ↓
 PRD.md   final_analysis  final_arch      task-NN.md        code + build  tests + commit
```

### Faza 1: Brief (PRD)

**Komenda:** `/ai-brief <task-description>` [--resume] [--with-user]

Tworzenie Product Requirements Document z asystą AI:

- Brief Writer tworzy **BIZNESOWY** PRD (max 300 linii)
- Brief Critic **ODRZUCA** szczegóły techniczne
- Tylko: problem, user stories, wymagania biznesowe, URLs
- **BEZ:** API specs, kodu, komponentów, schematu DB
- Iteracje (max 3x)

**Tryby:**

- `--with-user` - AI zadaje pytania PRZED napisaniem briefu
- Bez flagi - AI tworzy brief automatycznie

**Output:** `projects/project_*/brief.md` (~200-300 linii)

---

### Clarifications (uniwersalne)

**Komenda:** `/ai-clarify` [--phase brief|analysis|architecture|tasks]

Zbieranie odpowiedzi od użytkownika na pytania z critique:

- Automatycznie wykrywa aktualną fazę
- Zadaje pytania na podstawie critique
- Zapisuje odpowiedzi do `{phase}/clarifications.md`
- Następna iteracja uwzględnia clarifications

**Output:** `projects/project_*/{phase}/clarifications.md`

---

### Faza 2: Code Analysis

**Komenda:** `/ai-analyze` [--resume]

**TECHNICZNA** analiza kodu (przejęta z Brief):

- **Component Inventory** - weryfikacja istniejących komponentów
- **API Inventory** - weryfikacja istniejących endpointów
- **Database Analysis** - schema + validation issues (cuid vs uuid)
- **Gap Analysis** - co trzeba stworzyć
- Patterns (navigation, forms, translations)
- Critic review (max 3x)

**Output:** `projects/project_*/analysis/final_analysis.md`

---

### Faza 3: Architecture Design

**Komenda:** `/ai-architect` [--resume]

Projektowanie architektury rozwiązania:

- Design based on analysis + brief
- **Frontend awareness check** (URLs, menu, pages)
- Database schema planning
- Integration points
- Critic review (max 3x)

**Output:** `projects/project_*/architecture/final_architecture.md`

---

### Faza 4: Task Planning

**Komenda:** `/ai-plan-tasks` [--resume]

Rozbicie na zadania implementacyjne:

- Sekwencyjne taski z zależnościami
- Frontend + Backend dla każdego
- Routing i navigation updates
- Critic review (max 3x)

**Output:** `projects/project_*/tasks/{task-id}/spec.md` (osobne pliki per task)

---

### Faza 5: Coding

**Komenda:** `/ai-code-task <task-id>` [--resume]

Implementacja pojedynczego taska:

- Coder generuje kod based on specs
- **File Completeness Check** - weryfikacja czy wszystkie pliki zaimplementowane
- **Acceptance Criteria Check** - weryfikacja kryteriów
- Coder Critic sprawdza (max 3x)
- **Visual Verification** (UI tasks) - automatyczne testy via Puppeteer MCP
- **Równolegle:** Coding Practices Updater dodaje nowe zasady
- **Walidacja:** `npm run build` musi PASS

**Output:** Kod w `src/`, audit trail w `coding/task-*/`, screenshots w `coding/task-*/screenshots/`

---

### Faza 6: Testing

**Komenda:** `/ai-test-task <task-id>` [--resume]

Testowanie zadania:

- QA Tester pisze testy
- QA Critic weryfikuje (max 3x)
- Uruchomienie: `npm run test` + `npm run build`
- **Jeśli PASS:** Git commit z task description

**Output:** Testy w `src/`, commit w git

---

## 🗂️ Struktura Projektu

```
.ai-spec-flow/
├── README.md                   # Ten plik
├── QUICK_START.md              # Szybki start
├── coding-practices.md         # Pełne praktyki (dla Critic)
├── coding-practices-compact.md # Kompaktowe praktyki (dla Coder)
├── phase-summary-templates.md  # Szablony summary dla faz
├── architecture.md             # Mapa aplikacji
├── orchestrator-guide.md       # Przewodnik dla orkiestratora
└── projects/
    └── project_20251123143022_nazwa/
        ├── brief.md
        ├── progress.json
        ├── git-info.json
        ├── analysis/
        │   └── final_analysis.md
        ├── architecture/
        │   └── final_architecture.md
        ├── tasks/
        │   ├── index.md              # Overview: lista tasków
        │   ├── summary.md            # Compact summary
        │   ├── task-01/
        │   │   └── spec.md           # Specyfikacja taska
        │   ├── task-02a/
        │   │   └── spec.md
        │   └── task-02b/
        │       └── spec.md
        ├── coding/
        │   └── task-01/
        │       ├── coding-practices-snapshot.md
        │       ├── code_v1/
        │       ├── critique_v1.md
        │       └── final_code.md
        ├── testing/
        │   └── task-01/
        │       ├── tests_v1/
        │       └── test-results.txt
        └── final-report.md
```

## 🤖 Subagenci

### Workflow Agents (pary: agent + critic)

1. **Brief Writer** + **Brief Critic** - Tworzenie PRD
2. **Code Analyst** + **Code Analyst Critic** - Analiza kodu
3. **Software Architect** + **Software Architect Critic** - Projektowanie
4. **Task Planner** + **Task Planner Critic** - Planowanie tasków
5. **Coder** + **Coder Critic** - Implementacja
6. **QA Tester** + **QA Tester Critic** - Testowanie

### Specialized Agents

7. **Fixer** + **Fixer Critic** - Quick fixes outside Spec Flow
8. **Coding Practices Updater** - Aktualizacja praktyk (self-improving)
9. **Architecture Doc Updater** - Aktualizacja docs/architecture.md
10. **Git Doc Generator** - Generowanie dokumentacji z commitów
11. **Exec Doc Generator** - Generowanie dokumentacji wykonawczej w `/docs`
12. **Implementation Auditor** - Audyt wdrożenia (porównanie wymagań z kodem)
13. **Task Debugger** - Debugowanie tasków (Chrome DevTools + DB)
14. **Deployment Summary** - Krótkie podsumowanie dla testera
15. **Project Modifier** + **Project Modifier Critic** - Modyfikacja koncepcji projektu

**Razem:** 25 agentów

## 📝 Wszystkie Komendy

### Główny Workflow

| Komenda                                 | Opis                              | Output                               |
| --------------------------------------- | --------------------------------- | ------------------------------------ |
| `/ai-modify-project <project> <change>` | Modyfikacja koncepcji projektu    | `modifications/*.md`                 |
| `/ai-import-stage <project> <stage>`    | Import stage z AI Project Planner | `brief.md`                           |
| `/ai-brief <desc>`                      | Tworzenie PRD                     | `brief.md`                           |
| `/ai-analyze`                           | Analiza kodu                      | `analysis/final_analysis.md`         |
| `/ai-architect`                         | Projektowanie arch                | `architecture/final_architecture.md` |
| `/ai-plan-tasks`                        | Planowanie tasków                 | `tasks/task-*.md`                    |
| `/ai-code-task <id>`                    | Kodowanie taska                   | Kod w `src/`                         |
| `/ai-test-task <id>`                    | Testowanie taska                  | Testy + commit                       |

### Dokumentacja

| Komenda                             | Opis                            | Output            |
| ----------------------------------- | ------------------------------- | ----------------- |
| `/ai-generate-docs stage <project>` | Dokumentacja całego stage'a     | `docs/` folder    |
| `/ai-generate-docs task <task-id>`  | Dokumentacja pojedynczego taska | `docs/features/`  |
| `/ai-generate-docs update <target>` | Aktualizacja dokumentacji       | `docs/` update    |
| `/ai-docs-update`                   | Update architecture + practices | `architecture.md` |

### Audyt i Debugging

| Komenda                                     | Opis                              | Output                   |
| ------------------------------------------- | --------------------------------- | ------------------------ |
| `/ai-audit-implementation <project> full`   | Pełny audyt wdrożenia             | `audit/audit-report.md`  |
| `/ai-audit-implementation <project> quick`  | Szybkie podsumowanie              | `audit/audit-summary.md` |
| `/ai-audit-implementation <project> gaps`   | Tylko luki (co brakuje)           | Gap analysis             |
| `/ai-audit-implementation <project> extras` | Tylko extra (ponad plan)          | Extras report            |
| `/ai-debug-task <id> full`                  | Pełne debugowanie (UI+DB+Network) | `debug/debug-report.md`  |
| `/ai-debug-task <id> ui`                    | Tylko UI (DevTools)               | UI report                |
| `/ai-debug-task <id> db`                    | Tylko baza danych                 | DB report                |
| `/ai-debug-task <id> quick`                 | Szybki check (console+screenshot) | Quick report             |
| `/ai-deployment-summary <project>`          | Krótkie podsumowanie dla testera  | `deployment-summary.md`  |

### Pomocnicze

| Komenda                | Opis                          | Output                |
| ---------------------- | ----------------------------- | --------------------- |
| `/ai-clarify <phase>`  | Doprecyzowanie fazy           | Pytania → edycja      |
| `/ai-status`           | Status projektu               | Raport postępu        |
| `/ai-fix <desc>`       | Quick bug fix                 | Fix commit            |
| `/ai-update-practices` | Aktualizacja coding-practices | `coding-practices.md` |

**Wszystkie wspierają `--resume` dla kontynuacji pracy.**

## 🎯 Kluczowe Features

### 1. Ewoluujące Praktyki Kodowania

- Globalny `coding-practices.md` startuje z CLAUDE.md
- **Coding Practices Updater** analizuje krytyki i tworzy nowe reguły
- Uruchamiany ręcznie przez `/ai-update-practices` po kilku taskach
- Auto-sync do `coding-practices-compact.md`
- **Rezultat:** System uczy się i nie powtarza błędów

### 2. Frontend Awareness

- Brief wymusza określenie URLs, menu links, nowych stron
- Architecture Critic weryfikuje completeness
- Task Planner tworzy osobne "Frontend Integration" taski
- **Rezultat:** Zawsze wiadomo gdzie funkcjonalność jest dostępna

### 3. Git-Native Workflow

- Smart branch detection (feature vs main)
- Auto-commit po każdym tested tasku
- Tracking commitów w git-info.json
- **Rezultat:** Czysty git history, łatwy rollback

### 4. Resume Capability

- Każda komenda wspiera --resume
- progress.json przechowuje pełny stan
- Możliwość wznowienia z dowolnego punktu
- **Rezultat:** Można przerwać i wrócić w dowolnym momencie

### 5. Build Validation

- `npm run build` po każdym coded tasku
- Build fails → powrót do codera
- Tylko tested + built code jest commitowany
- **Rezultat:** Zawsze działający kod w repo

### 6. Critic Loop (max 3 iteracje)

- Agent → Critic → v2 → Critic → v3 → Critic
- Jeśli po v3 nadal "nie OK": USER REVIEW REQUIRED
- User odpowiada przez `--resume` lub edytuje pliki `.md`
- **Rezultat:** Kontrola jakości + user control

## 🚀 Quick Start

Zobacz [QUICK_START.md](./QUICK_START.md) dla przykładu end-to-end.

## 📚 Dokumentacja

- **README.md** (ten plik) - Przegląd systemu
- **QUICK_START.md** - Przykład użycia krok po kroku
- **orchestrator-guide.md** - Szczegóły implementacji dla developerów
- **coding-practices.md** - Praktyki kodowania (ewoluujące)
- **coding-practices-compact.md** - Skrócona wersja dla Codera
- **architecture.md** - Mapa aplikacji Papitto

## 🔄 Typowy Workflow

```bash
# 1. Start nowego projektu
/ai-brief "System zarządzania miotami dla hodowców"

# 2. Analiza istniejącego kodu
/ai-analyze

# 3. Projektowanie architektury
/ai-architect

# 4. Opcjonalnie: doprecyzowanie
/ai-clarify architecture
# ... edytuj plik z odpowiedziami ...
/ai-architect --resume

# 5. Planowanie tasków
/ai-plan-tasks

# 6. Implementacja task po tasku
/ai-code-task task-01
/ai-test-task task-01  # → auto commit jeśli pass

/ai-code-task task-02
/ai-test-task task-02

# 7. Sprawdzenie statusu
/ai-status

# 8. Update dokumentacji
/ai-docs-update
```

## ⚙️ Konfiguracja

### Claude Code

- Subagenci: `.claude/agents/`
- Komendy: `.claude/commands/`

### Windsurf

- Rules: `.windsurf/rules/`
- Workflows: `.windsurf/workflows/`
- Templates: `.windsurf/templates/`

### Współdzielone (oba systemy)

- Projekty: `.ai-spec-flow/projects/`
- Praktyki: `.ai-spec-flow/coding-practices.md`
- Mapa aplikacji: `.ai-spec-flow/architecture.md`

---

## 🔄 Claude Code vs Windsurf

System AI Spec Flow działa z **oboma** narzędziami. Używają tego samego folderu `.ai-spec-flow/projects/` dla danych projektów.

| Aspekt          | Claude Code                      | Windsurf                         |
| --------------- | -------------------------------- | -------------------------------- |
| **Komendy**     | `/ai-brief`, `/ai-analyze`, etc. | `/ai-brief`, `/ai-analyze`, etc. |
| **Lokalizacja** | `.claude/commands/`              | `.windsurf/workflows/`           |
| **Agenci**      | Osobne pliki (agent + critic)    | Zintegrowane w workflow          |
| **Rules**       | Embedded w agentach              | `.windsurf/rules/` (auto-loaded) |

**Możesz przełączać się między narzędziami** - oba czytają/zapisują do tego samego `.ai-spec-flow/projects/`

## 🛡️ Bezpieczeństwo

System egzekwuje zasady z `coding-practices.md`:

- **Database Protection:** Żadnych destructive operations
- **TypeScript Safety:** Zakaz `any`, pełne typy
- **React Best Practices:** Dependency arrays, props validation
- **Build Validation:** Kod musi się kompilować

## 📈 Self-Improving System

Kluczowa innowacja: **Coding Practices Updater**

```
Coder pisze kod → Critic znajdzie błąd typu X
                     ↓
          Practices Updater dodaje regułę "Nie rób X"
                     ↓
          Coder w następnym tasku dostaje zaktualizowane praktyki
                     ↓
          Nie popełnia błędu X już nigdy
```

## 🤝 Wsparcie

Jeśli system nie działa zgodnie z oczekiwaniami:

1. Sprawdź `progress.json` - aktualny stan
2. Sprawdź `git-info.json` - branch i commity
3. Użyj `/ai-status` - pełny raport
4. Użyj `/ai-clarify <phase>` - doprecyzuj problematyczną fazę
5. Użyj `--resume` - kontynuuj z ostatniego punktu

---

**Stworzono:** 2025-11-23
**Autor:** AI Spec Flow System
**Projekt:** Papitto (papitto.com)
