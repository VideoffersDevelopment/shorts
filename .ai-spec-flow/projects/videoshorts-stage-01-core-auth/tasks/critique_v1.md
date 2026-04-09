# Task Plan Critique v1

**Project:** videoshorts-stage-01-core-auth
**Type:** GREENFIELD
**Date:** 2025-11-28
**Critic Agent:** task-planner-critic

---

## VERDICT: REJECT

The task breakdown has **2 CRITICAL ISSUES** that must be resolved before proceeding to implementation.

---

## Critical Issues

### 1. Missing Visual Verification Steps (TASK 01)

**Task:** 01 - Project Setup
**Issue:** Task 01 states "NOT APPLICABLE - This is a setup task" for Visual Verification Steps.
**Required:** Even setup tasks need verification steps.

**Fix Required:**
Add Visual Verification Steps section with:
```markdown
## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to root | Next.js welcome page loads | `http://localhost:3000` |
| 2 | Verify no errors | Dev server running without errors | Terminal output |
| 3 | Check build | Production build succeeds | `npm run build` output |

### Screenshot Checkpoints
- `01-dev-server.png` - Dev server running on localhost:3000
- `02-build-success.png` - Build output showing success
```

---

### 2. Missing Visual Verification Steps (TASK 02)

**Task:** 02 - Core Infrastructure
**Issue:** Task 02 states "NOT APPLICABLE - This is an infrastructure task" for Visual Verification Steps.
**Required:** Infrastructure tasks need verification steps.

**Fix Required:**
Add Visual Verification Steps section with:
```markdown
## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Database: PostgreSQL connection configured
- Environment: `.env.local` file created with all variables

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Run migrations | Migration succeeds | `npx prisma migrate dev --name init` |
| 2 | Open Prisma Studio | Database GUI opens | `npx prisma studio` |
| 3 | Verify tables | 5 tables created (User, Account, Session, VerificationToken, UserProfile) | Prisma Studio UI |
| 4 | Check auth route | Auth API route exists | `http://localhost:3000/api/auth/signin` |
| 5 | Verify middleware | Middleware active | Check redirect from `/panel` to `/login` |

### Screenshot Checkpoints
- `01-prisma-studio.png` - Prisma Studio showing all tables
- `02-auth-route.png` - NextAuth signin page
- `03-middleware-redirect.png` - Redirect from protected route
```

---

## Validation Results

### 1. Vertical Slices
✅ **PASS** - Tasks organized by feature:
- Task 01: Project foundation
- Task 02: Core infrastructure (shared)
- Tasks 03-06: Independent feature slices (auth, profile, settings, preferences)
- Task 07: Integration layer

✅ **PASS** - Each task is self-contained and can be coded+tested independently (after dependencies)

---

### 2. Size Limits

✅ **PASS** - All tasks within limits:

| Task | Files | Est. Tokens | Status |
|------|-------|-------------|--------|
| 01 | 8 | ~8k | ✅ Simple |
| 02 | 12 | ~12k | ✅ Medium |
| 03 | 18 | ~18k | ✅ Medium |
| 04 | 14 | ~14k | ✅ Medium |
| 05 | 10 | ~10k | ✅ Simple |
| 06 | 9 | ~9k | ✅ Simple |
| 07 | 16 | ~16k | ✅ Medium |

**Total:** 87 files, ~97k tokens
**Max Task:** Task 03 (18 files, ~18k tokens) - within limit of 20 files/25k tokens

---

### 3. Dependencies

✅ **PASS** - Dependencies are logical and clear:
- Task 01 (Setup) → Blocks ALL (appropriate for greenfield)
- Task 02 (Infrastructure) → Depends on Task 01, blocks Tasks 03-07
- Tasks 03-06 → Independent of each other, can run in parallel
- Task 07 (Integration) → Depends on Tasks 03-06 (correct integration pattern)

✅ **PASS** - No circular dependencies detected

✅ **PASS** - Execution order makes sense for greenfield project

---

### 4. Acceptance Criteria

✅ **PASS** - Each task has testable acceptance criteria

✅ **PASS** - All tasks require `npm run build` to pass

✅ **PASS** - All tasks require no TypeScript errors

**Examples:**
- Task 03: "User can signup with email/password", "Verification email sent after signup"
- Task 04: "User can upload avatar image", "Avatar uploads to Cloudflare R2"
- Task 05: "User can change password", "All sessions invalidated after password change"

---

### 5. Translation Coverage

✅ **PASS** - All 5 languages included:
- Polski (pl)
- English (en)
- Deutsch (de)
- Español (es)
- Русский (ru)

✅ **PASS** - Translation files properly distributed:
- Task 03: auth.json + common.json (10 files)
- Task 04: profile.json (5 files)
- Task 05: settings.json (5 files)
- Task 06: preferences.json (5 files)
- Task 07: sidebar.json (5 files)

**Total:** 30 translation files

---

### 6. GREENFIELD Appropriateness

✅ **PASS** - Tasks assume no existing code

✅ **PASS** - Setup/infrastructure tasks first (Tasks 01-02)

✅ **PASS** - Integration task last (Task 07)

✅ **PASS** - Appropriate use of "Create" operation for all files

---

## Summary

**Issues Found:** 2 CRITICAL
**Status:** MUST FIX BEFORE PROCEEDING

### Required Actions

1. **Update Task 01 spec** (`tasks/task-01/spec.md`):
   - Replace "NOT APPLICABLE" Visual Verification Steps
   - Add table with verification steps
   - Add screenshot checkpoints

2. **Update Task 02 spec** (`tasks/task-02/spec.md`):
   - Replace "NOT APPLICABLE" Visual Verification Steps
   - Add table with Prisma/database verification steps
   - Add screenshot checkpoints

### After Fixes

Re-run critique to verify all issues resolved. Once both tasks have proper Visual Verification Steps sections, the task breakdown will be ready for implementation.

---

## Notes

- Tasks 03-07 have excellent Visual Verification Steps sections
- Overall structure is well-designed for greenfield project
- Size limits are appropriate and realistic
- Translation strategy is comprehensive
- Dependency graph is optimal for parallel execution
