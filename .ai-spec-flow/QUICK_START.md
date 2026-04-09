# Quick Start - AI Spec Flow

> Szybka referencja wszystkich komend systemu AI Spec Flow

---

## 📋 Wszystkie Komendy

### 🎯 Etap 1: Planowanie

| Komenda                                 | Opis                              | Warianty                                     |
| --------------------------------------- | --------------------------------- | -------------------------------------------- |
| `/ai-modify-project <project> <change>` | Modyfikacja koncepcji projektu    | -                                            |
| `/ai-import-stage <project> <stage>`    | Import stage z AI Project Planner | -                                            |
| `/ai-brief <opis>`                      | Tworzenie PRD od zera             | `--resume`, `--with-user`                    |
| `/ai-analyze`                           | Analiza istniejącego kodu         | `--resume`                                   |
| `/ai-architect`                         | Projektowanie architektury        | `--resume`                                   |
| `/ai-plan-tasks`                        | Rozbicie na taski                 | `--resume`                                   |
| `/ai-clarify <phase>`                   | Doprecyzowanie fazy               | `brief`, `analysis`, `architecture`, `tasks` |

### 💻 Etap 2: Kodowanie

| Komenda                   | Opis                               | Warianty                  |
| ------------------------- | ---------------------------------- | ------------------------- |
| `/ai-code-task <task-id>` | Implementacja pojedynczego taska   | `--resume`                |
| `/ai-test-task <task-id>` | Testy + commit                     | `--resume`                |
| `/ai-fix <opis>`          | Quick bug fix poza workflow        | -                         |
| `/ai-auto-run <project>`  | Automatyczne wykonanie wszystkiego | `phases`, `tasks`, `full` |

### 🔍 Etap 3: Review i Debugging

| Komenda                              | Opis                         | Warianty                          |
| ------------------------------------ | ---------------------------- | --------------------------------- |
| `/ai-debug-task <task-id>`           | Debugowanie (DevTools + DB)  | `full`, `ui`, `db`, `quick`       |
| `/ai-e2e-test <project>`             | E2E testy w przeglądarce     | `--fix`                           |
| `/ai-audit-implementation <project>` | Audyt wdrożenia vs wymagania | `full`, `quick`, `gaps`, `extras` |

### 📚 Etap 4: Dokumentacja i Podsumowanie

| Komenda                             | Opis                               | Warianty                  |
| ----------------------------------- | ---------------------------------- | ------------------------- |
| `/ai-deployment-summary <project>`  | Krótkie podsumowanie dla testera   | -                         |
| `/ai-generate-docs <mode> <target>` | Generowanie dokumentacji           | `stage`, `task`, `update` |
| `/ai-docs-update`                   | Update architecture.md + practices | -                         |
| `/ai-update-practices`              | Aktualizacja coding-practices.md   | -                         |

---

## 🚀 Typowy Workflow

```bash
# 1. Import stage (lub /ai-brief dla nowego projektu)
/ai-import-stage videoshorts 1

# 2. Planowanie
/ai-analyze
/ai-architect
/ai-plan-tasks

# 3. Kodowanie (powtórz dla każdego taska)
/ai-code-task task-01
/ai-test-task task-01

# 4. Review
/ai-e2e-test videoshorts-stage-01
/ai-audit-implementation videoshorts-stage-01 full

# 5. Dokumentacja
/ai-generate-docs stage videoshorts-stage-01
/ai-docs-update
```

---

## ⚡ Automatyzacja

```bash
# Wykonaj wszystkie fazy planowania
/ai-auto-run videoshorts-stage-01 phases

# Wykonaj wszystkie taski (code + test)
/ai-auto-run videoshorts-stage-01 tasks

# Wykonaj wszystko od początku do końca
/ai-auto-run videoshorts-stage-01 full
```

---

## 🔧 Warianty Komend

### `/ai-audit-implementation`

```bash
/ai-audit-implementation <project> full    # Pełny audyt
/ai-audit-implementation <project> quick   # Szybkie podsumowanie
/ai-audit-implementation <project> gaps    # Tylko luki (co brakuje)
/ai-audit-implementation <project> extras  # Tylko extra (ponad plan)
```

### `/ai-debug-task`

```bash
/ai-debug-task <task-id> full   # UI + DB + Network + Console
/ai-debug-task <task-id> ui     # Tylko Chrome DevTools
/ai-debug-task <task-id> db     # Tylko baza danych
/ai-debug-task <task-id> quick  # Screenshot + console errors
```

### `/ai-generate-docs`

```bash
/ai-generate-docs stage <project>     # Dokumentacja całego stage'a
/ai-generate-docs task <task-id>      # Dokumentacja pojedynczego taska
/ai-generate-docs update all          # Aktualizacja całej dokumentacji
/ai-generate-docs update api          # Tylko API docs
/ai-generate-docs update components   # Tylko komponenty
```

### `/ai-auto-run`

```bash
/ai-auto-run <project> phases  # analyze → architect → plan-tasks
/ai-auto-run <project> tasks   # code-task → test-task (wszystkie)
/ai-auto-run <project> full    # phases + tasks
```

---

## 📖 Więcej informacji

- [README.md](./README.md) - Pełny przegląd systemu
- [orchestrator-guide.md](./orchestrator-guide.md) - Szczegóły implementacji
- [coding-practices.md](./coding-practices.md) - Aktualne zasady kodowania
