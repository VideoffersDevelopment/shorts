# Task 06: Shorts Management UI

## Overview

**Priority:** MEDIUM
**Dependencies:** Task 03, Task 05
**Complexity:** Medium (18 files, ~18k tokens)
**Status:** pending

## What to Build

Complete shorts management dashboard:
1. Shorts data table with filters
2. Short card component
3. Short detail page
4. Edit metadata dialog
5. Archive/Delete confirmation dialogs
6. Duplicate functionality
7. Credits history and purchase modal
8. CRUD API routes
9. Server actions for update/delete/archive/duplicate

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/shorts/shorts-table.tsx` | Create | DataTable for shorts management |
| `src/components/shorts/shorts-filters.tsx` | Create | Status/search filter controls |
| `src/components/shorts/short-card.tsx` | Create | Card component for grid view |
| `src/components/shorts/edit-short-dialog.tsx` | Create | Edit metadata modal |
| `src/components/shorts/archive-dialog.tsx` | Create | Archive confirmation dialog |
| `src/components/shorts/delete-dialog.tsx` | Create | Delete confirmation dialog |
| `src/components/payments/credits-history.tsx` | Create | Transaction history table |
| `src/components/payments/credits-purchase-modal.tsx` | Create | Credit package purchase modal |
| `src/app/actions/shorts/update.ts` | Create | Update short metadata action |
| `src/app/actions/shorts/delete.ts` | Create | Delete draft action |
| `src/app/actions/shorts/archive.ts` | Create | Archive published short action |
| `src/app/actions/shorts/duplicate.ts` | Create | Duplicate short as draft action |
| `src/app/api/shorts/route.ts` | Create | GET list, POST create short |
| `src/app/api/shorts/[id]/route.ts` | Create | GET/PATCH/DELETE single short |
| `src/app/api/credits/route.ts` | Create | GET credits balance and history |
| `src/app/(main)/[locale]/panel/shorts/[id]/page.tsx` | Create | Short detail page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(main)/[locale]/panel/shorts/page.tsx` | Add table, filters, empty states |
| `src/app/(main)/[locale]/panel/credits/page.tsx` | Add history and purchase modal |

## Implementation Details

### 1. ShortsTable Component

```typescript
interface ShortsTableProps {
  shorts: ShortWithStats[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onPublish: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRenew: (id: string) => void
}

// Columns:
// - Thumbnail (image)
// - Title (link to detail)
// - Status (badge)
// - Views (number)
// - Created (date)
// - Expires (date or "-")
// - Actions (dropdown menu)

// Actions per status:
// DRAFT: View, Edit, Publish, Duplicate, Delete
// PUBLISHED: View, Edit, Archive, Duplicate
// ARCHIVED: View, Renew, Duplicate
```

### 2. ShortsFilters Component

```typescript
interface ShortsFiltersProps {
  status: 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  search: string
  onStatusChange: (status: string) => void
  onSearchChange: (search: string) => void
}

// Features:
// - Status tabs or dropdown
// - Search input with debounce
// - Clear filters button
```

### 3. ShortCard Component

```typescript
interface ShortCardProps {
  short: ShortWithStats
  onAction: (action: string) => void
}

// Grid-friendly card with:
// - Thumbnail preview
// - Title
// - Status badge
// - View count
// - Duration
// - Actions dropdown
```

### 4. EditShortDialog Component

```typescript
interface EditShortDialogProps {
  short: Short
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Editable fields:
// - Title (always)
// - Description (always)
// - Tags (always)
// - CTA Link (always)
// NOT editable: video, thumbnail, category
```

### 5. Server Actions

**updateShortMetadataAction:**
```typescript
export async function updateShortMetadataAction(
  shortId: string,
  data: unknown
): Promise<ActionResult<Short>>

// 1. AUTH + ownership check
// 2. Validate status (DRAFT or PUBLISHED only)
// 3. Validate input with updateShortSchema
// 4. Update short + handle tag changes
// 5. revalidatePath
```

**deleteShortAction:**
```typescript
export async function deleteShortAction(
  shortId: string
): Promise<ActionResult<{ success: boolean }>>

// 1. AUTH + ownership check
// 2. Validate status (DRAFT only)
// 3. Delete short (cascade deletes tags, stats)
// 4. Delete raw video from R2 if exists
// 5. revalidatePath
```

**archiveShortAction:**
```typescript
export async function archiveShortAction(
  shortId: string
): Promise<ActionResult<Short>>

// 1. AUTH + ownership check
// 2. Validate status (PUBLISHED only)
// 3. Update status -> ARCHIVED, archivedAt = now()
// 4. revalidatePath
```

**duplicateShortAction:**
```typescript
export async function duplicateShortAction(
  shortId: string
): Promise<ActionResult<{ shortId: string }>>

// 1. AUTH + ownership check
// 2. Check draft limit (max 10)
// 3. Copy short data based on source status:
//
//    **DRAFT shorts:**
//    - Copy rawVideoKey (reference to raw video in R2 - no file copy)
//    - Copy all metadata (title, description, category, location, CTA)
//    - Copy tags
//    - Set qencodeTaskId = null, hlsPlaylistUrl = null
//    - New short status = DRAFT
//
//    **PUBLISHED/ARCHIVED shorts:**
//    - Do NOT copy rawVideoKey (raw video may be deleted)
//    - Do NOT copy hlsPlaylistUrl (processed video belongs to original)
//    - Copy all metadata (title, description, category, location, CTA)
//    - Copy tags
//    - Set qencodeTaskId = null, hlsPlaylistUrl = null, rawVideoKey = null
//    - New short status = DRAFT
//    - User must upload new video for the duplicate
//
// 4. Copy ShortTag junction records to new short
// 5. Create new ShortStats record (zeroed)
// 6. revalidatePath
```

### 6. API Routes

**GET /api/shorts:**
```typescript
// Query params: status, search, page, limit
// Returns: { shorts: Short[], total: number, page: number }
// Includes: stats, tags, payment
```

**GET /api/shorts/[id]:**
```typescript
// Returns: Short with stats, tags, company
// Auth: owner only
```

**PATCH /api/shorts/[id]:**
```typescript
// Body: { title?, description?, tags?, ctaLink? }
// Returns: Updated Short
```

**DELETE /api/shorts/[id]:**
```typescript
// Soft delete (status: DELETED)
// Only for DRAFT status
```

### 7. Short Detail Page

```typescript
// Server component: /panel/shorts/[id]/page.tsx
// Shows:
// - Video player (if HLS available) or thumbnail
// - Full metadata
// - Status with timeline
// - Stats (views, likes, etc.)
// - Action buttons based on status
// - Edit button opens dialog
// - Publish button (if DRAFT)
```

### 8. Credits History Component

```typescript
interface CreditsHistoryProps {
  transactions: CreditTransaction[]
}

// Table columns:
// - Date
// - Type (source with icon)
// - Amount (+/-)
// - Balance after
// - Related short (link)
```

### 9. Credits Purchase Modal

```typescript
interface CreditsPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (credits: number) => void
}

// Package options:
// - 1 credit: 5 PLN
// - 5 credits: 22.50 PLN (save 10%)
// - 20 credits: 80 PLN (save 20%)
// - 50 credits: 175 PLN (save 30%)
// Provider selection: Przelewy24 / Tpay
```

## Acceptance Criteria

- [ ] ShortsTable displays all user shorts
- [ ] Filters work (status, search)
- [ ] Status badges show correct colors
- [ ] Actions dropdown shows correct options per status
- [ ] Edit dialog updates metadata correctly
- [ ] Archive dialog archives published shorts
- [ ] Delete dialog deletes drafts only
- [ ] Duplicate creates new draft with copied data
- [ ] Detail page shows all short information
- [ ] Credits history shows all transactions
- [ ] Purchase modal initiates checkout
- [ ] All API routes work with proper auth
- [ ] `npm run build` passes

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user with multiple shorts (different statuses)
- Some credits in account

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to Shorts | List page loads | `/panel/shorts` |
| 2 | Verify table | Shows all shorts | `table` or grid |
| 3 | Filter by status | Table filtered | `button:has-text("Drafts")` |
| 4 | Search by title | Results filtered | `input[placeholder*="Search"]` |
| 5 | Click short row | Detail page loads | `/panel/shorts/[id]` |
| 6 | Verify detail page | All metadata shown | |
| 7 | Click Edit button | Edit dialog opens | `button:has-text("Edit")` |
| 8 | Change title | Input updated | `input[name="title"]` |
| 9 | Save changes | Dialog closes, table updated | `button:has-text("Save")` |
| 10 | Click Archive (published) | Confirmation dialog | |
| 11 | Confirm archive | Status changes to ARCHIVED | |
| 12 | Click Duplicate | New draft created | |
| 13 | Navigate to Credits | Credits page loads | `/panel/credits` |
| 14 | Verify history | Transactions shown | `.credits-history` |
| 15 | Click Purchase | Modal opens | `button:has-text("Purchase")` |
| 16 | Select package | Price shown | `.package-card` |

### Screenshot Checkpoints

- `01-shorts-list-table.png` - Table with multiple shorts
- `02-shorts-filtered.png` - Filtered by status
- `03-short-detail.png` - Detail page
- `04-edit-dialog.png` - Edit metadata dialog
- `05-archive-confirm.png` - Archive confirmation
- `06-credits-page.png` - Credits with history
- `07-purchase-modal.png` - Credit packages

## Notes

- Use tanstack/react-table for DataTable if available
- Status badges use semantic colors (gray: draft, blue: processing, green: published, yellow: archived)
- Duplicate does NOT copy video files - references same rawVideoKey
- Only DRAFT shorts can be deleted
- Only PUBLISHED shorts can be archived
- Tags can be edited for both DRAFT and PUBLISHED
