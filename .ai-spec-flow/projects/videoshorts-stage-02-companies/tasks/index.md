# Task Breakdown: VideoShorts Stage 02 - Companies + Verification

**Project:** videoshorts-stage-02-companies
**Date:** 2025-12-15 (Updated: 2025-12-16)
**Total Tasks:** 12 (9 completed + 3 follow-up)
**Estimated Duration:** 2 weeks + 1 day

---

## Task Overview

| Task ID | Name | Priority | Dependencies | Complexity | Files | Est. Tokens | Status |
|---------|------|----------|--------------|------------|-------|-------------|--------|
| task-01 | Database Schema & Infrastructure | HIGH | None | Simple | 8 | ~8k | ✅ completed |
| task-02 | VIES Integration & Utilities | HIGH | task-01 | Medium | 6 | ~6k | ✅ completed |
| task-03 | Company Upgrade Flow | HIGH | task-01, task-02 | Medium | 12 | ~12k | ✅ completed |
| task-04 | Public Company Profile | HIGH | task-03 | Medium | 10 | ~10k | ✅ completed |
| task-05 | Company Profile Edit | HIGH | task-04 | Medium | 15 | ~15k | ✅ completed |
| task-06 | Admin Panel Foundation | HIGH | task-01 | Medium | 11 | ~11k | ✅ completed |
| task-07 | Admin Companies Management | HIGH | task-06 | Medium | 9 | ~9k | ✅ completed |
| task-08 | Admin Categories Management | HIGH | task-06 | Medium | 10 | ~10k | ✅ completed |
| task-09 | Navigation & Translations | HIGH | task-03, task-06 | Medium | 18 | ~18k | ✅ completed |

### Follow-up Tasks (Added 2025-12-16)

| Task ID | Name | Priority | Dependencies | Complexity | Files | Est. Tokens | Status |
|---------|------|----------|--------------|------------|-------|-------------|--------|
| task-10 | Fix Test Environment Issue | HIGH | None | Simple | 3 | ~3k | ⏳ pending |
| task-11 | Implement SubcategoryPicker | MEDIUM | task-05 | Medium | 8 | ~8k | ⏳ pending |
| task-12 | Implement BusinessHoursPicker | MEDIUM | task-05 | Medium | 9 | ~9k | ⏳ pending |

**Total Files:** ~119 files (99 + 20 follow-up)
**Total Estimated Tokens:** ~119k tokens

---

## Task Dependencies Graph

```
task-01 (Database) ✅
  ├─→ task-02 (VIES) ✅
  │     └─→ task-03 (Upgrade Flow) ✅
  │           ├─→ task-04 (Public Profile) ✅
  │           │     └─→ task-05 (Edit Profile) ✅
  │           │           ├─→ task-11 (SubcategoryPicker) ⏳
  │           │           └─→ task-12 (BusinessHoursPicker) ⏳
  │           └─→ task-09 (Navigation) ✅
  │
  └─→ task-06 (Admin Foundation) ✅
        ├─→ task-07 (Companies Admin) ✅
        ├─→ task-08 (Categories Admin) ✅
        │     └─→ task-10 (Test Env Fix) ⏳
        └─→ task-09 (Navigation) ✅
```

---

## Implementation Strategy

### Phase 1: Foundation (Days 1-2) ✅ COMPLETED
- **task-01:** Database schema, migrations, seed ✅
- **task-02:** VIES client, slug generation ✅

### Phase 2: Company Core (Days 3-5) ✅ COMPLETED
- **task-03:** Upgrade flow (form + actions) ✅
- **task-04:** Public profile page ✅
- **task-05:** Edit profile page (with uploads) ✅

### Phase 3: Admin Panel (Days 6-8) ✅ COMPLETED
- **task-06:** Admin layout + middleware ✅
- **task-07:** Companies management ✅
- **task-08:** Categories management ✅

### Phase 4: Integration (Days 9-10) ✅ COMPLETED
- **task-09:** Navigation updates, translations ✅

### Phase 5: Follow-up Fixes (Day 11) ⏳ PENDING
- **task-10:** Fix test environment (Vitest + next/server)
- **task-11:** SubcategoryPicker UI component
- **task-12:** BusinessHoursPicker UI component

---

## Follow-up Tasks Details

### Task-10: Fix Test Environment Issue
**Source:** Audit report 2025-12-16
**Issue:** 3 test suites failing due to Next.js module resolution in Vitest
**Impact:** 94% test suite pass rate (should be 100%)
**Fix:** Add `next/server` mock to Vitest config
**Effort:** 1 hour

### Task-11: Implement SubcategoryPicker
**Source:** Audit report (REQ-PROFILE-06 partial)
**Issue:** Database field exists, UI component missing
**Impact:** Companies can't select subcategories via UI
**Fix:** Create multi-select dropdown with max 3 selection
**Effort:** 4 hours

### Task-12: Implement BusinessHoursPicker
**Source:** Audit report (REQ-PROFILE-09 partial)
**Issue:** Database field exists, visual editor missing
**Impact:** Companies can't set business hours via UI
**Fix:** Create 7-day time picker with open/close toggle
**Effort:** 6 hours

---

## Complexity Analysis

### By Complexity Level
- **Simple (≤10 files):** 2 tasks (task-01, task-10)
- **Medium (≤20 files):** 10 tasks
- **Complex (>20 files):** 0 tasks

### All tasks are within limits:
- ✅ All tasks ≤20 files
- ✅ All tasks ≤25k tokens
- ✅ Each task completable in ONE coder response

---

## Vertical Slice Breakdown

Each task includes:
1. **Database changes** (if needed)
2. **Backend logic** (Server Actions / API routes)
3. **Frontend components**
4. **Translations** (5 languages)
5. **Visual verification steps** (for Chrome DevTools MCP)

---

## Risk Mitigation

### Task-02 (VIES Integration) - HIGH RISK ✅ RESOLVED
- External EU API (unstable)
- Mitigation: Retry logic, fallback to manual verification
- **Status:** Implemented with exponential backoff

### Task-05 (Logo/Banner Upload) - MEDIUM RISK ✅ RESOLVED
- R2 upload complexity
- Mitigation: Reuse avatar-upload pattern from Stage 01
- **Status:** Working with image cropping

### Task-09 (Translations) - MEDIUM RISK ✅ RESOLVED
- 18 files across 5 languages
- Mitigation: Clear template structure, batch creation
- **Status:** 1,100 translations added

### Task-10 (Test Environment) - LOW RISK
- Next.js server module mocking
- Mitigation: Standard Vitest alias configuration
- **Status:** Pending

---

## Execution Order for Follow-up Tasks

1. **task-10** (Test Environment Fix) - No dependencies, quick win
2. **task-11** (SubcategoryPicker) - Depends on task-05
3. **task-12** (BusinessHoursPicker) - Depends on task-05, can run parallel with task-11

---

## Next Steps

### For Completed Tasks (task-01 to task-09):
- ✅ All implemented and tested
- ✅ 1204/1217 tests passing (99%)
- ⚠️ 3 test suites blocked by environment issue

### For Follow-up Tasks (task-10 to task-12):

**Step 1: Fix Test Environment (HIGHEST PRIORITY)**
```
/ai-code-task task-10
```

**Step 2: Implement SubcategoryPicker**
```
/ai-code-task task-11
```

**Step 3: Implement BusinessHoursPicker**
```
/ai-code-task task-12
```

---

**Prepared by:** AI Task Planner
**Updated:** 2025-12-16 (Follow-up tasks added from audit)
**Status:** ⏳ 9/12 Tasks Completed (75%)
