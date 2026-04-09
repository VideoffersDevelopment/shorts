# Code Review: Task 03 - Iteration 1/3

**Commit:** 3c2ea4203d1e27d5e396ffd2e6f4ca337c3b56da
**Verdict:** CHANGES REQUIRED

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | VideoDropzone handles drag & drop and file picker | PASS | `video-dropzone.tsx` lines 163-185, 187-191 |
| 2 | Video duration and aspect ratio detected before upload | PASS | `video-dropzone.tsx` lines 34-53 |
| 3 | Upload progress bar works correctly | PASS | `video-dropzone.tsx` lines 98-106, 218-223 |
| 4 | Aspect ratio warning shown for non-9:16 videos | FAIL | No warning implementation found |
| 5 | Metadata form validates all fields | PASS | `short-metadata-form.tsx` uses zodResolver |
| 6 | Tags autocomplete searches API and creates new tags | PASS | `tags-autocomplete.tsx` lines 42-63, 210-223 |
| 7 | Thumbnail selector allows auto or custom upload | PASS | `thumbnail-selector.tsx` full implementation |
| 8 | Wizard navigates between 4 steps | PASS | `video-upload-wizard.tsx` STEPS array |
| 9 | Review step shows all entered data | PASS | `video-upload-wizard.tsx` lines 201-303 |
| 10 | createShortAction creates draft with tags | PASS | `create.ts` full transaction |
| 11 | Shorts list page displays company's shorts | PASS | `page.tsx` lines 88-148 |
| 12 | Empty state shows on first visit | PASS | `page.tsx` lines 149-167 |
| 13 | Navigation shows new menu items for COMPANY users | PASS | `app-sidebar.tsx` lines 29-33 |
| 14 | npm run build passes | PASS | Build successful |
| 15 | No TypeScript errors | PASS | Build completed without TS errors |

**Acceptance Criteria Result:** 14/15 criteria met (1 missing feature)

---

## Code Quality Issues

### 1. BLOCKER: Missing Aspect Ratio Warning

**File:** `a:\wamp64\www\shorts\src\components\shorts\video-dropzone.tsx`
**Problem:** The acceptance criteria requires "Aspect ratio warning shown for non-9:16 videos" but there is no warning implementation. The aspect ratio is detected (line 42) but no warning is displayed to the user.
**Fix:** Add aspect ratio warning when video is not 9:16 format.

```typescript
// After line 68-75, add aspect ratio check and warning:
// Check aspect ratio and warn if not 9:16
const [width, height] = metadata.aspectRatio.split(":").map(Number)
const isVertical = width && height && (height / width) >= 1.7 && (height / width) <= 1.8

// Return metadata with warning flag
return { valid: true, metadata: { ...metadata, isNot9x16: !isVertical } }
```

Then display a warning in the UI when aspect ratio is not optimal.

---

### 2. HIGH: Hardcoded English Text in TagsAutocomplete

**File:** `a:\wamp64\www\shorts\src\components\shorts\tags-autocomplete.tsx:221`
**Problem:** Hardcoded English text "Create" that should use i18n translation.
**Fix:** Replace hardcoded text with translation key.

```typescript
// Line 221 - Change from:
<span>Create &quot;{inputValue.trim()}&quot;</span>

// To:
<span>{t("wizard.metadata.createTag")} &quot;{inputValue.trim()}&quot;</span>
```

Then add the translation key to all 6 locale files:
- en: `"createTag": "Create"`
- pl: `"createTag": "Utworz"`
- de: `"createTag": "Erstellen"`
- es: `"createTag": "Crear"`
- ru: `"createTag": "Sozdat'"`
- uk: `"createTag": "Stvoryty"`

---

### 3. MEDIUM: Console.log Statements Should Be Removed

**Files affected:**
- `a:\wamp64\www\shorts\src\components\shorts\video-dropzone.tsx:135`
- `a:\wamp64\www\shorts\src\components\shorts\tags-autocomplete.tsx:58`
- `a:\wamp64\www\shorts\src\components\shorts\thumbnail-selector.tsx:87`
- `a:\wamp64\www\shorts\src\components\shorts\video-upload-wizard.tsx:142`
- `a:\wamp64\www\shorts\src\app\actions\shorts\create.ts:180`

**Problem:** Production code contains `console.error` statements. While error logging is sometimes useful, these should use a proper logging service or be removed.
**Fix:** Remove console statements or replace with structured logging.

---

### 4. MEDIUM: Missing Translation Keys in Shorts List Page

**File:** `a:\wamp64\www\shorts\src\app\(main)\[locale]\panel\shorts\page.tsx:128-129`
**Problem:** The strings `views` and `likes` are used inline with stats but could be better structured.
**Current code:**
```typescript
<span>{short.stats?.views ?? 0} {t("detail.views")}</span>
```
**Note:** This is acceptable as-is since it uses translation keys.

---

### 5. LOW: Using `<img>` Instead of Next.js `<Image>`

**Files affected:**
- `a:\wamp64\www\shorts\src\app\(main)\[locale]\panel\shorts\page.tsx:95-99`
- `a:\wamp64\www\shorts\src\components\shorts\thumbnail-selector.tsx:219`
- `a:\wamp64\www\shorts\src\components\shorts\video-upload-wizard.tsx:276`

**Problem:** ESLint warnings about using `<img>` instead of Next.js `<Image>` component.
**Note:** This is a warning, not a blocker. For user-uploaded dynamic images with unknown dimensions, `<img>` is sometimes acceptable.

---

## Server Action Review (create.ts)

| Check | Status | Notes |
|-------|--------|-------|
| "use server" directive | PASS | Line 1 |
| Auth check | PASS | Lines 32-36 |
| Company role check | PASS | Lines 38-41 |
| Company profile authorization | PASS | Lines 43-54 |
| Input validation with Zod | PASS | Lines 56-59 |
| Draft limit check | PASS | Lines 78-88 |
| Prisma transaction | PASS | Lines 91-170 |
| revalidatePath call | PASS | Line 173 |
| Proper error handling | PASS | Lines 179-182 |

The server action follows all required security patterns.

---

## Component Review Summary

| Component | Type Safety | Hooks | i18n | Security |
|-----------|-------------|-------|------|----------|
| video-dropzone.tsx | PASS | PASS | PASS | PASS |
| video-preview.tsx | PASS | PASS | PASS | PASS |
| short-metadata-form.tsx | PASS | PASS | PASS | PASS |
| tags-autocomplete.tsx | PASS | PASS | FAIL (hardcoded text) | PASS |
| thumbnail-selector.tsx | PASS | PASS | PASS | PASS |
| step-indicator.tsx | PASS | PASS | PASS | PASS |
| video-upload-wizard.tsx | PASS | PASS | PASS | PASS |

---

## Translation Files Review

| Locale | company.shorts | company.credits | Status |
|--------|----------------|-----------------|--------|
| en | "My Shorts" | "Credits" | PASS |
| pl | "Moje Shortsy" | "Kredyty" | PASS |
| de | "Meine Shorts" | "Guthaben" | PASS |
| es | "Mis Shorts" | "Creditos" | PASS (minor: should be "Creditos" with accent) |
| ru | "Moi Shorts" | "Kredity" | PASS (transliterated) |
| uk | "Moi Shorts" | "Kredyty" | PASS (transliterated) |

---

## Required Fixes Before Approval

### Must Fix (BLOCKER):
1. **Add aspect ratio warning** - Display warning when uploaded video is not in 9:16 format

### Should Fix (HIGH):
2. **Translate hardcoded "Create" text** in tags-autocomplete.tsx

### Optional (MEDIUM/LOW):
3. Consider removing console.error statements
4. Consider using Next.js Image component for thumbnails

---

## Summary

The implementation is solid overall with proper TypeScript types, correct React patterns, comprehensive server action security, and working i18n integration. However, there is **one missing acceptance criterion** (aspect ratio warning) and **one i18n violation** (hardcoded text) that should be addressed.

**Recommendation:** Fix the aspect ratio warning (BLOCKER) and the hardcoded text (HIGH) before next review iteration.
