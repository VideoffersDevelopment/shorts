# Task 03: Upload Wizard UI + Server Action

## Overview

**Priority:** HIGH
**Dependencies:** Task 02
**Complexity:** Medium (18 files, ~18k tokens)
**Status:** pending

## What to Build

Multi-step upload wizard for creating shorts:
1. VideoDropzone component (drag & drop with progress)
2. Video preview component
3. Metadata form (title, description, category, tags, location, CTA)
4. Tags autocomplete component
5. Thumbnail selector (auto/custom)
6. Step indicator component
7. Complete wizard wrapper
8. Server action for creating shorts
9. Panel pages (list + new)
10. Navigation updates

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/shorts/video-dropzone.tsx` | Create | Drag & drop video upload with validation |
| `src/components/shorts/video-preview.tsx` | Create | Preview uploaded video (HTML5 video) |
| `src/components/shorts/short-metadata-form.tsx` | Create | Metadata form with React Hook Form |
| `src/components/shorts/tags-autocomplete.tsx` | Create | Tag input with API search |
| `src/components/shorts/thumbnail-selector.tsx` | Create | Auto/custom thumbnail selection |
| `src/components/shorts/step-indicator.tsx` | Create | Wizard step progress indicator |
| `src/components/shorts/video-upload-wizard.tsx` | Create | Main wizard wrapper component |
| `src/app/actions/shorts/create.ts` | Create | Server action to create short draft |
| `src/app/(main)/[locale]/panel/shorts/page.tsx` | Create | Shorts list page |
| `src/app/(main)/[locale]/panel/shorts/new/page.tsx` | Create | New short wizard page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/app-sidebar.tsx` | Add shorts and credits menu items for COMPANY role |
| `src/lib/locales/en/sidebar.json` | Add "shorts" and "credits" translations |
| `src/lib/locales/pl/sidebar.json` | Add "shorts" and "credits" translations |
| `src/lib/locales/de/sidebar.json` | Add "shorts" and "credits" translations |
| `src/lib/locales/es/sidebar.json` | Add "shorts" and "credits" translations |
| `src/lib/locales/ru/sidebar.json` | Add "shorts" and "credits" translations |
| `src/lib/locales/uk/sidebar.json` | Add "shorts" and "credits" translations |

## Implementation Details

### 1. VideoDropzone Component

```typescript
interface VideoDropzoneProps {
  onUploadComplete: (data: { key: string; duration: number; aspectRatio: string }) => void
  onUploadError: (error: string) => void
  maxSizeMB?: number  // default: 100
  maxDurationSec?: number  // default: 60
}

// Features:
// - Drag & drop using react-dropzone (or native)
// - Client-side validation: format, size
// - Video duration/aspect detection via HTML5 video element
// - Get presigned URL from /api/shorts/upload-url
// - Upload with XMLHttpRequest for progress
// - Progress bar display
// - Aspect ratio warning if not 9:16
```

### 2. ShortMetadataForm Component

```typescript
interface ShortMetadataFormProps {
  defaultValues?: Partial<ShortMetadataInput>
  companyCategory?: string
  companyLocation?: { lat: number; lng: number; address: string }
  onSubmit: (data: ShortMetadataInput) => void
  onBack?: () => void
  isSubmitting?: boolean
}

// Reuses:
// - CategoryCombobox from companies
// - AddressLocation from companies
// - Form components from ui/form
```

### 3. TagsAutocomplete Component

```typescript
interface TagsAutocompleteProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxTags?: number  // default: 10
  placeholder?: string
}

// Features:
// - Input with tag chips
// - API search with debounce
// - Create new tags on Enter
// - Remove tags with X button
// - Max tags limit enforcement
```

### 4. ThumbnailSelector Component

```typescript
interface ThumbnailSelectorProps {
  videoKey?: string
  value: { type: 'auto' | 'custom'; url?: string }
  onChange: (value: { type: 'auto' | 'custom'; url?: string }) => void
}

// Features:
// - Radio selection: Auto vs Custom
// - Custom: file picker + upload to R2
// - Preview of custom thumbnail
```

### 5. VideoUploadWizard Component

```typescript
interface VideoUploadWizardProps {
  companyId: string
  defaultCategoryId?: string
  defaultLocation?: { lat: number; lng: number; address: string }
  onComplete: (shortId: string) => void
  onCancel: () => void
}

// Steps: VIDEO -> METADATA -> THUMBNAIL -> REVIEW
// State management with useReducer or useState
// Validation between steps
// Final submission calls createShortAction
```

### 6. createShortAction Server Action

```typescript
export async function createShortAction(
  data: unknown
): Promise<ActionResult<{ shortId: string }>>

// Steps:
// 1. AUTH - verify session
// 2. AUTHORIZATION - verify company profile exists
// 3. LIMIT CHECK - max 10 drafts per company
// 4. VALIDATION - validate input with createShortSchema
// 5. TRANSACTION:
//    - Create Short record
//    - Create/upsert Tags
//    - Create ShortTag junction records
//    - Create ShortStats record
// 6. revalidatePath("/panel/shorts")
// 7. Return { shortId }
```

### 7. Shorts List Page

```typescript
// src/app/(main)/[locale]/panel/shorts/page.tsx
// Server component that fetches company's shorts
// Empty state with "Create Your First Short" CTA
// Links to /panel/shorts/new
```

### 8. Navigation Update

Add to companyItems array in app-sidebar.tsx:
```typescript
{ href: `/${locale}/panel/shorts`, icon: Video, label: t("company.shorts") },
{ href: `/${locale}/panel/credits`, icon: CreditCard, label: t("company.credits") }
```

### 9. Sidebar Translation Keys

Add the following keys to all 6 sidebar.json files:

**English (en/sidebar.json):**
```json
{
  "company": {
    "shorts": "My Shorts",
    "credits": "Credits"
  }
}
```

**Polish (pl/sidebar.json):**
```json
{
  "company": {
    "shorts": "Moje Shortsy",
    "credits": "Kredyty"
  }
}
```

**German (de/sidebar.json):**
```json
{
  "company": {
    "shorts": "Meine Shorts",
    "credits": "Guthaben"
  }
}
```

**Spanish (es/sidebar.json):**
```json
{
  "company": {
    "shorts": "Mis Shorts",
    "credits": "Creditos"
  }
}
```

**Russian (ru/sidebar.json):**
```json
{
  "company": {
    "shorts": "Moi Shorty",
    "credits": "Kredity"
  }
}
```

**Ukrainian (uk/sidebar.json):**
```json
{
  "company": {
    "shorts": "Moi Shorty",
    "credits": "Kredyty"
  }
}
```

## Acceptance Criteria

- [ ] VideoDropzone handles drag & drop and file picker
- [ ] Video duration and aspect ratio detected before upload
- [ ] Upload progress bar works correctly
- [ ] Aspect ratio warning shown for non-9:16 videos
- [ ] Metadata form validates all fields
- [ ] Tags autocomplete searches API and creates new tags
- [ ] Thumbnail selector allows auto or custom upload
- [ ] Wizard navigates between 4 steps
- [ ] Review step shows all entered data
- [ ] createShortAction creates draft with tags
- [ ] Shorts list page displays company's shorts
- [ ] Empty state shows on first visit
- [ ] Navigation shows new menu items for COMPANY users
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: Login as company user (TEST_USER_EMAIL / TEST_USER_PASSWORD)
- Company profile: Must have ACTIVE verified company

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to login | Login page loads | `/login` |
| 2 | Login as test company user | Redirect to panel | `input[name="email"]`, `input[name="password"]` |
| 3 | Check sidebar | "My Shorts" link visible | `a[href*="/panel/shorts"]` |
| 4 | Click "My Shorts" | Shorts list page loads | `/panel/shorts` |
| 5 | Verify empty state | "Create Your First Short" button | `button:has-text("Create")` or link |
| 6 | Click create button | Wizard page loads | `/panel/shorts/new` |
| 7 | Verify step indicator | Step 1 "Video" highlighted | `.step-indicator` |
| 8 | Drag video file | Dropzone accepts file | `.dropzone` |
| 9 | Wait for upload | Progress bar completes | `.progress-bar` |
| 10 | Click Next | Step 2 "Details" shown | `button:has-text("Next")` |
| 11 | Fill title field | Validation passes | `input[name="title"]` |
| 12 | Select category | Category selected | Category combobox |
| 13 | Add tags | Tags appear as chips | `.tag-chip` |
| 14 | Click Next | Step 3 "Thumbnail" shown | |
| 15 | Select Auto thumbnail | Radio selected | `input[value="auto"]` |
| 16 | Click Next | Step 4 "Review" shown | |
| 17 | Review data | All entered data visible | |
| 18 | Click "Save as Draft" | Draft created, redirect | |
| 19 | Verify list | New short appears in list | `/panel/shorts` |

### Screenshot Checkpoints

- `01-sidebar-shorts.png` - Sidebar with My Shorts link
- `02-shorts-list-empty.png` - Empty state
- `03-wizard-step1.png` - Video upload step
- `04-wizard-upload-progress.png` - Upload in progress
- `05-wizard-step2.png` - Metadata form
- `06-wizard-step3.png` - Thumbnail selection
- `07-wizard-step4.png` - Review step
- `08-shorts-list-with-draft.png` - List with new draft

## Notes

- Use existing patterns from BannerUpload for drag & drop
- Use CompanyProfileForm pattern for React Hook Form
- CategoryCombobox and AddressLocation can be reused directly
- Video duration detection uses HTML5 video element's loadedmetadata event
- For large files, consider chunked upload in future (not MVP)
