# Orchestrator Guide - AI Spec Flow System

> Szczegółowy przewodnik implementacyjny dla developerów tworzących/utrzymujących system workflow

## 📋 Spis Treści

1. [Kluczowe Koncepty](#kluczowe-koncepty)
2. [Struktura Plików](#struktura-plików)
3. [Subagenci - Role i Odpowiedzialności](#subagenci)
4. [Komendy - Implementacja](#komendy)
5. [Iteration Logic](#iteration-logic)
6. [Gate Checks](#gate-checks)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Kluczowe Koncepty

### Sequential Execution z Gate Checks

**NIGDY nie skipuj kroków** - każda faza ma obowiązkowe punkty weryfikacji.

```
Step 1 → Gate Check ✓ → Step 2 → Gate Check ✓ → Step 3
                ↓ FAIL                    ↓ FAIL
              ERROR                     ERROR
```

### Iteration Control (Max 3x)

```
Agent v1 → Critic v1 → "Issues" → Agent v2 → Critic v2 → "Issues" → Agent v3 → Critic v3
                                                                                    ↓
                                                                            "Issues" → USER REVIEW
                                                                            "OK" → Accept
```

### File Naming Conventions

#### Dla każdej fazy (analysis, architecture, task-planning, coding, testing):

**Prompts:**

- `prompt_v1.md`, `prompt_v2.md`, `prompt_v3.md`

**Responses (output agenta):**

- `response_v1.md`, `response_v2.md`, `response_v3.md`

**Critiques (output krytyka):**

- `critique_v1.md`, `critique_v2.md`, `critique_v3.md`

**Final (zaakceptowana wersja):**

- `final_analysis.md` (faza analysis)
- `final_architecture.md` (faza architecture)
- `final_code.md` (faza coding - podsumowanie zmian)
- `final_test_results.txt` (faza testing)

### $OUTPUT_PATH Pattern

**Każdy agent dostaje w promptcie jawny $OUTPUT_PATH:**

```markdown
# Analysis Request

[... treść prompta ...]

$OUTPUT*PATH: .ai-spec-flow/projects/project*\*/analysis/response_v1.md
```

**Agent używa Write tool aby sam zapisać output.**

---

## Struktura Plików

### Globalne (w .ai-spec-flow/)

```
.ai-spec-flow/
├── README.md                    # Dokumentacja główna
├── QUICK_START.md               # Przykład użycia
├── orchestrator-guide.md        # Ten plik
├── coding-practices.md          # Pełne praktyki (dla Critic)
├── coding-practices-compact.md  # Kompaktowe praktyki (dla Coder)
└── architecture.md              # Mapa aplikacji (GLOBAL)
```

### Per-Project (w .ai-spec-flow/projects/)

```
.ai-spec-flow/projects/project_YYYYMMDDHHMMSS_slug/
├── brief.md                     # PRD zadania
├── brief/
│   └── summary.md               # ⭐ COMPACT summary dla następnych faz
├── progress.json                # Stan workflow
├── git-info.json                # Branch, commits
├── analysis/
│   ├── response_v1.md
│   ├── critique_v1.md
│   ├── final_analysis.md        # Ostateczna wersja
│   └── summary.md               # ⭐ COMPACT summary dla architect
├── architecture/
│   ├── response_v1.md
│   ├── critique_v1.md
│   ├── final_architecture.md
│   └── summary.md               # ⭐ COMPACT summary dla coder
├── tasks/
│   ├── index.md                 # Overview: lista tasków, status
│   ├── summary.md               # ⭐ COMPACT summary dla coder
│   ├── task-01/
│   │   └── spec.md              # Specyfikacja taska (osobny plik)
│   ├── task-02a/
│   │   └── spec.md
│   └── task-02b/
│       └── spec.md
├── coding/
│   ├── task-01/
│   │   ├── coding-practices-snapshot.md  # Compact practices
│   │   ├── critique_v1.md
│   │   └── summary.md           # ⭐ Per-task summary
│   │   ├── practices-updates_v1.md      # Nowe zasady dodane
│   │   ├── build-result_v1.txt
│   │   └── final_code.md
│   └── task-02/...
├── testing/
│   ├── task-01/
│   │   ├── test-plan_v1.md
│   │   ├── critique_v1.md
│   │   └── test-results.txt
│   └── task-02/...
└── final-report.md
```

---

## Subagenci

### Lista Wszystkich (19 agentów)

#### Workflow Agents (pary agent + critic):

1. **brief-writer** + **brief-critic**
2. **code-analyst** + **code-analyst-critic**
3. **software-architect** + **software-architect-critic**
4. **task-planner** + **task-planner-critic**
5. **coder** + **coder-critic**
6. **qa-tester** + **qa-tester-critic**
7. **fixer** + **fixer-critic** - Quick fixes outside Spec Flow

#### Specialized Agents:

8. **coding-practices-updater** - Równoległy z coder-critic
9. **architecture-doc-updater** - Po tested task
10. **git-doc-generator** - Po tested task

### Agent Roles - Szczegóły

#### brief-writer

**Lokalizacja:** `.claude/agents/subagent_brief_writer.md`

**Role:**

- Tworzy PRD (Product Requirements Document)
- Wyciąga requirements z user description
- Wymusza frontend awareness (URLs, menu, pages)
- Definiuje acceptance criteria

**Input:**

- User task description
- Templates/brief-template.md

**Output:**

- `brief.md` z sekcjami:
  - Problem Statement
  - User Stories
  - Functional Requirements
  - Frontend Specification (URLs, navigation, pages)
  - Backend Specification
  - Acceptance Criteria

**Critical Rules:**

- MUST include frontend accessibility info
- MUST be specific (no vague requirements)
- MUST follow template structure

---

#### brief-critic

**Lokalizacja:** `.claude/agents/subagent_brief_critic.md`

**Role:**

- Weryfikuje completeness brief
- Sprawdza frontend awareness
- Identyfikuje ambiguities
- Zadaje clarifying questions jeśli potrzebne

**Input:**

- `brief.md` (wersja do review)

**Output:**

- `critique_v1.md`:
  - Jeśli OK: single word "OK"
  - Jeśli issues: bulleted list of specific problems

**Evaluation Criteria:**

- [ ] Frontend accessibility jasno określone?
- [ ] Requirements specific i measurable?
- [ ] User stories kompletne?
- [ ] Acceptance criteria testowalne?
- [ ] Brak ambiguities?

---

#### code-analyst

**Lokalizacja:** `.claude/agents/subagent_code_analyst.md` (EXISTS - update)

**Role:**

- Analizuje istniejący kod aplikacji
- Znajduje reużywalne komponenty
- Identyfikuje patterns
- Rekomenduje approach bazujący na istniejącym kodzie

**Input:**

- `brief.md`
- `.ai-spec-flow/coding-practices.md`
- `.ai-spec-flow/architecture.md`
- Access to full codebase (Grep, Glob, Read)

**Output:**

- `analysis/response_v1.md` z sekcjami:
  - Reusable Components (z file paths i line numbers)
  - Existing Patterns (z przykładami)
  - Database Models (Prisma schema analysis)
  - Recommendations (jak wykorzystać istniejący kod)

**Tools Used:**

- Grep (szukanie po keywords)
- Glob (szukanie plików po patterns)
- Read (czytanie promising files)

**Critical Rules:**

- NEVER write new code - only analyze
- Include file paths: `[file.ts:10-50](file.ts#L10-L50)`
- Exact TypeScript signatures
- Explain HOW to reuse każdy component

---

#### code-analyst-critic

**Role:** Weryfikacja completeness analizy

**Evaluation:**

- [ ] Wszystkie relevant components identified?
- [ ] Signatures accurate?
- [ ] File paths provided?
- [ ] Reusability explained?
- [ ] Thorough search wykonany?

---

#### software-architect

**Lokalizacja:** `.claude/agents/subagent_software_architect.md` (EXISTS - update)

**Role:**

- Projektuje high-level architecture
- Bazuje na code analysis + brief
- Maksymalizuje reuse
- Egzekwuje SOLID, KISS, YAGNI

**Input:**

- `brief.md`
- `analysis/final_analysis.md`
- `coding-practices.md`

**Output:**

- `architecture/response_v1.md` z sekcjami:
  - Database Schema (Prisma models - ADDITIVE only)
  - API Routes (REST endpoints)
  - Server Actions (CRUD operations)
  - UI Components (React components)
  - Routing Plan (URLs, navigation)
  - Integration Points

**Critical Constraints:**

- Database changes ADDITIVE only (no DROP, no data loss)
- NO `any` types w designs
- MAXIMIZE reuse from analysis
- SOLID principles
- Not over-engineered (KISS, YAGNI)

---

#### software-architect-critic

**Role:** Review architecture dla soundness + compliance

**Evaluation:**

- [ ] Maximizes reuse z analysis?
- [ ] **FRONTEND AWARENESS:**
  - [ ] URLs określone?
  - [ ] Menu links wskazane?
  - [ ] Nowe strony opisane?
  - [ ] Routing plan kompletny?
- [ ] SOLID principles followed?
- [ ] Not over-engineered (KISS/YAGNI)?
- [ ] Database changes additive only?
- [ ] NO `any` types?
- [ ] Implementation plan logical?

---

#### task-planner

**Lokalizacja:** `.claude/agents/subagent_task_planner.md`

**Role:**

- Rozbija architecture na sekwencyjne taski
- Określa dependencies
- Tworzy osobne frontend integration taski

**Input:**

- `brief.md`
- `analysis/final_analysis.md`
- `architecture/final_architecture.md`

**Output:**

- `tasks/task-01-nazwa.md`, `task-02-nazwa.md`, etc.
- `tasks/overview.md` (podsumowanie wszystkich)

**Task Structure:**

```markdown
# Task 01: Database Schema

## Opis

[Co zostanie zrobione]

## Files to Create/Modify

- `path/to/file.ts` (create/modify)

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies

- None (lub: Requires task-XX completed)

## Estimated Complexity

LOW / MEDIUM / HIGH
```

---

#### task-planner-critic

**Evaluation:**

- [ ] Frontend uwzględniony w każdym tasku gdzie potrzebny?
- [ ] Dependencies między taskami OK?
- [ ] Każdy task atomowy (nie za duży)?
- [ ] Routing + navigation updates zaplanowane?

---

#### coder

**Lokalizacja:** `.claude/agents/subagent_coder.md` (EXISTS - update)

**Role:**

- Implementuje single task bazując na specs
- Pisze production-ready TypeScript kod
- Śledzi coding-practices.md

**Input:**

- `brief.md`
- `analysis/final_analysis.md`
- `architecture/final_architecture.md`
- `tasks/task-XX.md`
- `coding/task-XX/coding-practices-snapshot.md`

**Output:**

- Rzeczywisty kod w `src/` (Write/Edit tools)
- `coding/task-XX/response_v1.md` (lista zmian)

**Critical Rules (z coding-practices.md):**

- NO `any` types - ABSOLUTELY FORBIDDEN
- ALL React hook dependencies included
- Match signatures EXACTLY as specified
- Complete implementation - NO TODOs, NO placeholders
- Follow existing patterns

---

#### coder-critic

**Role:** Code review dla type safety, security, quality

**Evaluation:**

- [ ] **Type Safety:** Any `any` types? (CRITICAL)
- [ ] **React:** All deps in hooks? (MAJOR)
- [ ] **Security:** Input validation? Auth checks? (CRITICAL)
- [ ] **Errors:** Proper error handling? (MAJOR)
- [ ] **Completeness:** Any TODOs or placeholders? (CRITICAL)
- [ ] **Quality:** Clean, readable code?

**Output:**

- `critique_v1.md`:
  - Jeśli OK: "OK"
  - Jeśli issues: Lista błędów z kategoriami (CRITICAL/MAJOR/MINOR)

---

#### coding-practices-updater

**Lokalizacja:** `.claude/agents/subagent_coding_practices_updater.md`

**Role:** Self-improving system - dodaje nowe zasady do coding-practices.md

**Kiedy uruchomić:**

- Równolegle z coder-critic
- TYLKO gdy critic znajdzie **NOWY TYP** błędu

**Input:**

- `coding/task-XX/critique_v1.md` (błędy znalezione)
- `.ai-spec-flow/coding-practices.md` (obecne zasady)

**Output:**

- `coding/task-XX/practices-updates_v1.md` (nowe zasady)
- **Append** do `.ai-spec-flow/coding-practices.md`

**Logic:**

```
IF critique zawiera błąd typu X:
  IF coding-practices.md NIE zawiera zasady dla błędu typu X:
    Stwórz nową zasadę z:
      - Problem description
      - ❌ ŹLE (przykład błędnego kodu)
      - ✅ DOBRZE (przykład poprawnego kodu)
      - Powód (dlaczego to ważne)
    Append do coding-practices.md
```

**Rezultat:** Coder w następnym tasku dostaje zaktualizowane praktyki i nie powtarza błędu.

---

#### qa-tester

**Lokalizacja:** `.claude/agents/subagent_qa_tester.md` (EXISTS - update)

**Role:**

- Pisze comprehensive test suites
- Unit + Integration + E2E

**Input:**

- `coding/task-XX/final_code.md`
- `tasks/task-XX.md` (acceptance criteria)

**Output:**

- Test files w `src/**/*.test.ts`
- `testing/task-XX/test-plan_v1.md`

**Test Requirements:**

- Happy path tests
- Edge case tests (empty, null, boundaries)
- Error handling tests
- Integration tests (jeśli applicable)

**Frameworks:**

- Jest dla unit tests
- React Testing Library dla components
- Playwright/Cypress dla E2E (jeśli potrzebne)

---

#### qa-tester-critic

**Evaluation:**

- [ ] Coverage: Happy path + edge cases + errors?
- [ ] Quality: Meaningful assertions?
- [ ] Completeness: All components tested?
- [ ] No brittle tests (implementation details)?

---

#### architecture-doc-updater

**Lokalizacja:** `.claude/agents/subagent_architecture_doc_updater.md`

**Role:** Aktualizuje `.ai-spec-flow/architecture.md` po każdym tested task

**Bazuje na:** `.windsurf/workflows/architecture-writer.md`

**Input:**

- Obecny `.ai-spec-flow/architecture.md`
- `coding/task-XX/final_code.md` (co zostało dodane)
- `git-info.json` (commity)

**Output:**

- Zaktualizowany `.ai-spec-flow/architecture.md` z:
  - Nowymi modułami
  - Nowymi API routes
  - Nowymi komponentami
  - Zmianami w strukturze

**Workflow:**

1. Czyta obecną architecture.md
2. Identyfikuje sekcje do aktualizacji
3. Proponuje zmiany (nie przepisuje całości)
4. Zapisuje

---

#### git-doc-generator

**Lokalizacja:** `.claude/agents/subagent_git_doc_generator.md`

**Role:** Generuje dokumentację bazując na commit history

**Input:**

- `git-info.json` (lista commitów projektu)
- Git log (`git log --oneline`)

**Output:**

- `docs/features/project_YYYYMMDD_slug/overview.md`
- `docs/features/project_YYYYMMDD_slug/commits.md`

**Struktura overview.md:**

```markdown
# Feature: [Nazwa z brief]

## Implemented

[Data]

## Description

[Z brief.md]

## Changes

- Database: [Lista modeli dodanych/zmienionych]
- API: [Lista routes/actions]
- UI: [Lista komponentów/stron]

## Commits

[Lista commit SHA z messages]

## Testing

[Podsumowanie testów]
```

---

## Komendy

### Szablon Komendy (wszystkie podobne)

**Front Matter:**

```yaml
---
description: [Krótki opis co robi]
allowed-tools: Read, Write, Edit, Bash, Task, TodoWrite
argument-hint: <task-description> [--resume]
model: sonnet
---
```

**Sekcje:**

1. Setup
2. Check progress.json
3. Load inputs
4. Generate prompt
5. Invoke agent
6. Verify output (GATE CHECK)
7. Invoke critic
8. Evaluate critique
9. Iteration logic (max 3x)
10. Update progress.json

### Przykład: /ai-analyze

```markdown
---
description: Phase 2 - Analyze codebase to find reusable components
allowed-tools: Read, Write, Bash, Task, TodoWrite
argument-hint: [--resume]
model: sonnet
---

# AI Analyze - Code Analysis Phase

## SETUP

**Check Prerequisites:**
Read `progress.json`:

- Current phase must be "brief_completed"
- If not: ERROR "Must complete /ai-brief first"

**Load Inputs:**

- brief.md
- .ai-spec-flow/coding-practices.md
- .ai-spec-flow/architecture.md

**Create Folder:**
mkdir -p analysis/

## ITERATION LOOP (MAX 3x)

v = 1

while v <= 3:

# STEP 1: Generate Prompt

Read template: .ai-spec-flow/templates/analysis-prompt.md

IF v == 1:
Fill template with: - Task from brief.md - Coding practices - Architecture map
ELSE:
Add to template: - Previous response_v[v-1].md - Critique_v[v-1].md issues

Save to: analysis/prompt_v[v].md

# STEP 2: Invoke Agent

Task tool:
subagent_type: "code-analyst"
prompt: [content of prompt_v[v].md]

# GATE CHECK

IF analysis/response_v[v].md NOT exists:
ERROR "Agent failed to save output"

# STEP 3: Invoke Critic

Task tool:
subagent_type: "code-analyst-critic"
prompt: Review analysis/response_v[v].md

# GATE CHECK

IF analysis/critique_v[v].md NOT exists:
ERROR "Critic failed to save output"

# STEP 4: Evaluate

Read analysis/critique_v[v].md

IF content == "OK":
cp analysis/response_v[v].md analysis/final_analysis.md
Update progress.json → phase: "analysis_completed"
BREAK

IF v == 3: # USER REVIEW REQUIRED
Output: "Analysis rejected 3 times. Options: [...]"
WAIT for user input via --resume

v++

## COMPLETION

Output to user:
"✅ Code Analysis Complete
Iterations: [v]
Output: analysis/final_analysis.md
Next: /ai-architect"
```

---

## Iteration Logic

### Standard Flow (Agent → Critic → Decision)

```
┌─────────────────────────────────────┐
│  v = 1                              │
├─────────────────────────────────────┤
│  1. Generate prompt_v1.md           │
│  2. Invoke Agent → response_v1.md   │
│  3. GATE CHECK: exists?             │
│  4. Invoke Critic → critique_v1.md  │
│  5. GATE CHECK: exists?             │
│  6. Read critique_v1.md             │
│     ├─ "OK" → Accept, save final    │
│     └─ "Issues" ↓                   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  v = 2                              │
├─────────────────────────────────────┤
│  1. Generate prompt_v2.md           │
│     (includes critique_v1 issues)   │
│  2. Invoke Agent → response_v2.md   │
│  3. GATE CHECK                      │
│  4. Invoke Critic → critique_v2.md  │
│  5. GATE CHECK                      │
│  6. Read critique_v2.md             │
│     ├─ "OK" → Accept, save final    │
│     └─ "Issues" ↓                   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  v = 3 (FINAL ATTEMPT)              │
├─────────────────────────────────────┤
│  1. Generate prompt_v3.md           │
│  2. Invoke Agent → response_v3.md   │
│  3. GATE CHECK                      │
│  4. Invoke Critic → critique_v3.md  │
│  5. GATE CHECK                      │
│  6. Read critique_v3.md             │
│     ├─ "OK" → Accept, save final    │
│     └─ "Issues" → USER REVIEW ⚠️    │
└─────────────────────────────────────┘
```

### User Review Options

Gdy critic odrzuca po v3:

```markdown
⚠️ WYMAGANA INTERWENCJA UŻYTKOWNIKA

Agent: [nazwa]
Iteracje: 3/3 (max reached)
Ostatni output: [file path]
Ostatnia krytyka: [file path]

Opcje:
A. Zaakceptuj v3 jako final (może mieć minor issues)
B. Odpowiedz na pytania krytyka i użyj --resume:
/ai-[command] --resume "Moje odpowiedzi na pytania..."
C. Edytuj plik response_v3.md bezpośrednio i użyj --resume:

# Edytujesz plik ręcznie

/ai-[command] --resume

Co wybierasz?
```

---

## Gate Checks

### Czym jest Gate Check?

**Punkt weryfikacji** przed kontynuacją - zapewnia integralność workflow.

### Typy Gate Checks:

#### 1. File Existence Check

```bash
test -f "$FILE_PATH"
```

**Kiedy:** Po każdym agent invocation

**Co sprawdza:** Czy agent zapisał output do $OUTPUT_PATH

**Fail action:**

```
ERROR: Agent [name] failed to save output to $OUTPUT_PATH

Possible causes:
1. Agent misunderstood $OUTPUT_PATH instruction
2. Write tool failed (permissions?)
3. Agent generated error instead of output

Recovery:
- Check Task tool response for errors
- Verify file permissions
- Re-invoke agent with clearer instructions
```

#### 2. File Content Check

```bash
test -s "$FILE_PATH"  # Not empty
```

**Kiedy:** Po file existence check

**Co sprawdza:** Czy plik nie jest pusty

#### 3. Progress Prerequisites Check

```json
// progress.json
{
	"currentPhase": "brief_completed"
}
```

**Kiedy:** Na początku każdej komendy

**Co sprawdza:** Czy poprzednia faza completed

**Fail action:**

```
ERROR: Prerequisites not met

Current phase: [actual]
Required phase: [expected]

You must complete /ai-[previous-command] first.
```

#### 4. Build Validation Check

```bash
npm run build > build-result.txt 2>&1
echo $?  # Exit code: 0 = success, non-zero = fail
```

**Kiedy:** Po każdym coded task (przed testing)

**Co sprawdza:** Czy kod się kompiluje

**Fail action:**

```
❌ BUILD FAILED

Task: task-XX
Iteration: v[N]
Build log: coding/task-XX/build-result_v[N].txt

Action: Returning to coder with build errors.
Next iteration: v[N+1] (if N < 3)
```

#### 5. Test Validation Check

```bash
npm run test > test-results.txt 2>&1
echo $?
```

**Kiedy:** W testing phase

**Co sprawdza:** Czy testy passują

**Fail action:**

```
❌ TESTS FAILED

Task: task-XX
Test results: testing/task-XX/test-results_v[N].txt

Action: Returning to qa-tester for fixes.
```

---

## Error Handling

### Error Types & Recovery

#### Type 1: Agent Failed to Save Output

**Symptom:**

```
ERROR: File not found: analysis/response_v1.md
```

**Diagnosis:**

1. Check Task tool response - czy jest error message?
2. Check file permissions - czy folder writable?
3. Check $OUTPUT_PATH in prompt - czy jasny?

**Recovery:**

```markdown
# Option A: Re-invoke with clearer instructions

Modify prompt to include:

**CRITICAL**: You MUST save output using Write tool to:
$OUTPUT_PATH: [exact path]

Do NOT output to stdout. Use Write tool explicitly.

# Option B: Manual save

IF agent provided output in response but didn't save:
Manually save agent's response to expected path
Continue workflow
```

#### Type 2: Critic Rejects After 3 Iterations

**Symptom:**

```
Iteration 3/3: Critic still reports issues
```

**User Decision Required:**

```markdown
Options:
A. Accept v3 (override critic)
B. Provide clarification to break tie
C. Manual intervention (edit file)
```

**Implementation:**

```bash
# Option A
cp response_v3.md final_output.md
# Continue

# Option B
# User provides input via --resume
/ai-command --resume "Clarification: [...]"
# Generate v4 with user input (exception to 3-iteration rule)

# Option C
# User edits response_v3.md manually
# Then:
cp response_v3.md final_output.md
# Continue
```

#### Type 3: Build Failures

**Symptom:**

```
npm run build exited with code 1
```

**Recovery:**

- Coder gets another iteration (if < 3)
- Build errors included in next prompt
- Critic enforces stricter type checking

#### Type 4: Git Branch Issues

**Symptom:**

```
ERROR: Cannot create branch - already on feature branch
```

**Smart Logic:**

```bash
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" == "main" ]]; then
  # Create new feature branch
  BRANCH="feature/task-$(date +%Y%m%d)-$SLUG"
  git checkout -b "$BRANCH"
elif [[ "$CURRENT_BRANCH" == feature/* ]]; then
  # Already on feature branch - continue
  echo "Continuing on existing branch: $CURRENT_BRANCH"
else
  # Unknown branch - ask user
  echo "On branch: $CURRENT_BRANCH"
  echo "Create new feature branch? (y/n)"
  # Wait for --resume with answer
fi
```

---

## Best Practices

### 1. Always Read Before Decide

```bash
# ❌ BAD
if critique contains "OK":
  proceed

# ✅ GOOD
Read: critique_v1.md
CONTENT=$(cat critique_v1.md)
if [[ "$CONTENT" == "OK" ]]; then
  proceed
fi
```

### 2. Use Absolute Paths

```bash
# ❌ BAD (relative)
$OUTPUT_PATH: analysis/response_v1.md

# ✅ GOOD (absolute via variable)
PROJECT_DIR=".ai-spec-flow/projects/project_20251123_slug"
$OUTPUT_PATH: $PROJECT_DIR/analysis/response_v1.md
```

### 3. Verify Before Proceed

```bash
# After every critical step:
test -f "$EXPECTED_FILE" || {
  echo "ERROR: Expected file not found"
  exit 1
}
```

### 4. TodoWrite Tracking

```bash
# At phase start:
TodoWrite: "Phase 2: Code Analysis" → in_progress

# At phase end:
TodoWrite: "Phase 2: Code Analysis" → completed
```

Użytkownik widzi real-time progress.

### 5. Specific Error Messages

```bash
# ❌ BAD
echo "Something went wrong"

# ✅ GOOD
echo "ERROR: Code Analyst failed to save output
Expected: $PROJECT_DIR/analysis/response_v1.md
Found: [file not found]
Possible cause: Agent did not use Write tool
Recovery: Check Task tool response for errors"
```

### 6. Embedded CLAUDE.md Rules

**Każdy agent ma embedded rules w swojej definicji:**

```markdown
---
name: coder
description: Production-ready code generation
---

# Coder Agent

## CRITICAL RULES (from CLAUDE.md)

### 🛡️ Database Protection

- ❌ NEVER `npm run db:reset`
- ✅ ADDITIVE changes only

### 🚫 TypeScript Type Safety

- ❌ NEVER use `any` type
- ✅ Explicit types always

[... rest of agent definition ...]
```

### 7. Progress.json Structure

```json
{
	"projectId": "project_20251123143530_litters",
	"branch": "feature/task-20251123-litters",
	"currentPhase": "coding",
	"phases": {
		"brief": {
			"status": "completed",
			"iterations": 2,
			"timestamp": "2025-11-23T14:35:30Z"
		},
		"analysis": {
			"status": "completed",
			"iterations": 1,
			"timestamp": "2025-11-23T14:40:15Z"
		},
		"architecture": {
			"status": "completed",
			"iterations": 3,
			"userReviewRequired": false,
			"timestamp": "2025-11-23T14:50:22Z"
		},
		"taskPlanning": {
			"status": "completed",
			"tasksCreated": 5,
			"timestamp": "2025-11-23T15:00:10Z"
		},
		"coding": {
			"status": "in_progress",
			"tasks": [
				{
					"id": "task-01",
					"status": "tested",
					"iterations": 2,
					"buildPassed": true,
					"committed": "abc123def"
				},
				{
					"id": "task-02",
					"status": "coding",
					"iterations": 1,
					"buildPassed": false
				},
				{
					"id": "task-03",
					"status": "pending"
				}
			]
		},
		"testing": {
			"status": "partial",
			"tasks": [
				{ "id": "task-01", "status": "passed" },
				{ "id": "task-02", "status": "pending" }
			]
		}
	},
	"lastUpdated": "2025-11-23T16:20:45Z"
}
```

### 8. Git-info.json Structure

```json
{
	"projectId": "project_20251123143530_litters",
	"branch": "feature/task-20251123-litters",
	"commits": [
		{
			"sha": "abc123def",
			"message": "feat(litters): add database models",
			"timestamp": "2025-11-23T15:30:22Z",
			"task": "task-01"
		},
		{
			"sha": "def456abc",
			"message": "feat(litters): add server actions",
			"timestamp": "2025-11-23T16:15:10Z",
			"task": "task-02"
		}
	],
	"lastCommit": "def456abc",
	"totalCommits": 2
}
```

---

## Configuration & Customization

### Change Max Iterations

W każdej komendzie:

```bash
# Default: 3
MAX_ITERATIONS=3

# Can be changed to:
MAX_ITERATIONS=5  # Allow more attempts
```

### Skip Certain Phases

Jeśli testing nie potrzebny (tylko prototyp):

```bash
# Comment out /ai-test-task implementation
# Workflow ends po coding
```

### Add New Agent

1. Utwórz `.claude/agents/subagent_new_agent.md`
2. Dodaj front matter z `description` i `<example>` blocks
3. Define role, responsibilities, critical rules
4. Update orchestrator-guide.md (ten plik)
5. Dodaj do listy agentów w README.md

---

## Task Size Management

### Responsibility: Task Planner + Task Planner Critic

**Coder NIE waliduje rozmiaru zadań** - to odpowiedzialność fazy planowania.

### Prevention Strategy

```
Task Planner (Step 2.5)     →    Task Planner Critic (Check 2.5)
   ↓                                    ↓
Analyzes complexity              Validates limits
Auto-splits if needed            Rejects if >20 files or >25k tokens
   ↓                                    ↓
Subtasks: 02a, 02b, 02c          Requires split strategy
```

### Limity

| Tier    | Files | Tokens  | Status        |
| ------- | ----- | ------- | ------------- |
| Simple  | ≤10   | ≤10,000 | ✅ PASS       |
| Medium  | ≤20   | ≤20,000 | ✅ PASS       |
| Complex | >20   | >25,000 | ❌ MUST SPLIT |

**Token estimation:** `files_count × 1000`

### Splitting Strategy

**Pattern:** Backend → Panel UI → Public UI → Integration

```
Task 02 (35 files) → Split into:
├── Task 02a: Backend Foundation (8 files, ~8k tokens)
├── Task 02b: Panel UI (13 files, ~13k tokens)
├── Task 02c: Public UI (11 files, ~11k tokens)
└── Task 02d: Integration (3 files, ~3k tokens)
```

### Coder's Role

- ✅ Assumes tasks are properly sized
- ✅ Focuses on implementation only
- ✅ No validation overhead
- ❌ Does NOT check task size

**If Task Planner fails to split properly → fix Task Planner, not Coder.**

---

## Fixer Flow (Outside Spec Flow)

### Purpose

Quick bug fixes + lesson extraction dla błędów wykrytych poza standardowym workflow.

### When to Use

- Hotfixy produkcyjne
- Błędy zgłoszone przez użytkowników
- Błędy wykryte podczas testów manualnych
- Szybkie poprawki nie wymagające pełnego Spec Flow

### Command

```bash
/ai-fix "opis błędu" [--file path] [--error "message"]
```

### Flow

```
User: "Mam błąd X"
         ↓
    /ai-fix command
         ↓
┌─────────────────────────────────────────┐
│  FIXER                                  │
│  - Analizuje błąd                       │
│  - Implementuje minimalny fix           │
│  - Git commit (prefix: fix:)            │
│  - Ocenia: czy to powtarzalny pattern?  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  FIXER CRITIC                           │
│  - Weryfikuje build                     │
│  - Sprawdza minimalność                 │
│  - Waliduje lekcję (jeśli jest)         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  UPDATE PRACTICES (conditional)         │
│  Jeśli pattern → dodaj kompaktową       │
│  zasadę FIX-XX do coding-practices.md   │
└─────────────────────────────────────────┘
```

### Kompaktowy Format Zasad z Fixera

```markdown
### FIX-[N]: [Tytuł]

**Pattern:** [co robić] | **Anti-pattern:** [czego nie robić]
**Przykład:** `[kod OK]` vs `[kod ŹLE]`
```

**MAX 3 linie na zasadę!**

### Agents

| Agent        | File                                      | Role                    |
| ------------ | ----------------------------------------- | ----------------------- |
| Fixer        | `.claude/agents/subagent_fixer.md`        | Fix + lesson extraction |
| Fixer Critic | `.claude/agents/subagent_fixer_critic.md` | Verification            |

### Key Principles

- **Minimalne zmiany** - surgical fix, nie refaktoryzacja
- **Lesson extraction opcjonalny** - tylko jeśli pattern
- **Kompaktowe zasady** - max 3 linie
- **Niezależny od Spec Flow** - szybki turnaround

---

## Debugging Workflow

### Enable Verbose Logging

W każdej komendzie dodaj:

```bash
set -x  # Print each command before execution
```

### Check Audit Trail

```bash
# Po każdej fazie:
ls -la $PROJECT_DIR/[phase]/

# Sprawdź wszystkie prompts:
cat $PROJECT_DIR/analysis/prompt_v*.md

# Sprawdź wszystkie critiques:
cat $PROJECT_DIR/analysis/critique_v*.md
```

### Validate progress.json

```bash
cat .ai-spec-flow/projects/project_*/progress.json | jq .
```

Jeśli malformed JSON → ERROR

---

## Maintenance

### Regular Updates

1. **Coding practices:** Review `.ai-spec-flow/coding-practices.md` co miesiąc - usuń przestarzałe zasady
2. **Architecture map:** Update `.ai-spec-flow/architecture.md` gdy major refactor
3. **Agents:** Update agent definitions gdy znajdziesz lepsze prompting patterns

### Monitoring System Health

```bash
# Check ile zasad w coding-practices.md:
wc -l .ai-spec-flow/coding-practices.md

# Jeśli > 1000 linii: przejrzyj i konsoliduj

# Check success rate:
grep -r "status.*completed" .ai-spec-flow/projects/*/progress.json | wc -l
grep -r "status.*failed" .ai-spec-flow/projects/*/progress.json | wc -l
```

---

**Koniec Orchestrator Guide**

Dla przykładów użycia zobacz [QUICK_START.md](./QUICK_START.md)
