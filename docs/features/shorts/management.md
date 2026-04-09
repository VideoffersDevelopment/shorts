# Shorts Management Feature

**Status:** Implemented (Stage 03)
**Components:** ShortsTable, ShortsFilters, EditShortDialog, ArchiveDialog, DeleteDialog

---

## Overview

Complete CRUD operations for managing company shorts with filtering, search, and batch operations.

---

## Dashboard Layout

```
+------------------------------------------------------------------+
|  My Shorts                                      [+ Create Short] |
+------------------------------------------------------------------+
|  [All] [Drafts] [Published] [Archived]     [Search...] [Filters] |
+------------------------------------------------------------------+
|  | Thumbnail | Title        | Status    | Views | Created | ... |
|  |-----------|--------------|-----------|-------|---------|-----|
|  | [img]     | Summer Sale  | Published | 1.2k  | Dec 30  | ... |
|  | [img]     | New Product  | Draft     | -     | Dec 29  | ... |
|  | [img]     | Holiday Sp   | Archived  | 542   | Nov 15  | ... |
+------------------------------------------------------------------+
```

---

## Components

### ShortsTable

DataTable component for listing shorts with sorting and actions.

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
```

**Columns:**
| Column | Type | Sortable |
|--------|------|----------|
| Thumbnail | Image | No |
| Title | Text (link) | Yes |
| Status | Badge | Yes |
| Views | Number | Yes |
| Created | Date | Yes |
| Expires | Date | Yes |
| Actions | Dropdown | No |

### ShortsFilters

Status tabs and search input.

```typescript
interface ShortsFiltersProps {
  status: 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  search: string
  onStatusChange: (status: string) => void
  onSearchChange: (search: string) => void
}
```

### ShortCard

Grid-friendly card for alternative view.

```typescript
interface ShortCardProps {
  short: ShortWithStats
  onAction: (action: string) => void
}
```

---

## Status-Based Actions

| Status | Available Actions |
|--------|-------------------|
| **DRAFT** | View, Edit, Publish, Duplicate, Delete |
| **PROCESSING** | View (no actions until complete) |
| **PUBLISHED** | View, Edit, Archive, Duplicate |
| **ARCHIVED** | View, Renew, Duplicate |
| **DELETED** | (hidden from UI) |

### Status Badges

| Status | Color | Icon |
|--------|-------|------|
| DRAFT | Gray | FileText |
| PENDING_PAYMENT | Yellow | CreditCard |
| PROCESSING | Blue | Loader |
| PUBLISHED | Green | CheckCircle |
| ARCHIVED | Orange | Archive |

---

## Server Actions

### updateShortMetadataAction

Update short title, description, tags, or CTA link.

```typescript
export async function updateShortMetadataAction(
  shortId: string,
  data: unknown
): Promise<ActionResult<Short>>
```

**Editable Fields:**
- Title (max 100 chars)
- Description (max 500 chars)
- Tags (max 10)
- CTA Link (valid URL)

**NOT Editable:** Video, Thumbnail, Category

### archiveShortAction

Archive a published short before its 30-day expiry.

```typescript
export async function archiveShortAction(
  shortId: string
): Promise<ActionResult<Short>>
```

**Requirements:**
- Short must be PUBLISHED
- User must own the short

**Effects:**
- Status -> ARCHIVED
- archivedAt = now()
- Removed from public feed
- Still accessible via direct link

### deleteShortAction

Permanently delete a draft short.

```typescript
export async function deleteShortAction(
  shortId: string
): Promise<ActionResult<{ success: boolean }>>
```

**Requirements:**
- Short must be DRAFT
- User must own the short

**Effects:**
- Short deleted from database
- Raw video deleted from R2
- Tags usage counts decremented

### duplicateShortAction

Create a copy of any short as a new draft.

```typescript
export async function duplicateShortAction(
  shortId: string
): Promise<ActionResult<{ shortId: string }>>
```

**Behavior by Source Status:**

| Source Status | Video Copied | Metadata Copied | New Status |
|---------------|--------------|-----------------|------------|
| DRAFT | Yes (rawVideoKey) | Yes | DRAFT |
| PUBLISHED | No | Yes | DRAFT (needs video) |
| ARCHIVED | No | Yes | DRAFT (needs video) |

**Copy includes:**
- Title (+ " (Copy)" suffix)
- Description
- Category
- Tags
- Location
- CTA Link

---

## API Routes

### GET /api/shorts

List company's shorts with filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | "all" | Filter by status |
| search | string | - | Search title/description |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```typescript
{
  shorts: Short[]
  total: number
  page: number
  limit: number
}
```

### GET /api/shorts/[id]

Get single short with relations.

**Response:**
```typescript
{
  id: string
  title: string
  description: string
  status: ShortStatus
  hlsPlaylistUrl: string
  thumbnailUrl: string
  duration: number
  stats: {
    views: number
    likes: number
    ctaClicks: number
  }
  tags: Tag[]
  company: CompanyProfile
  createdAt: string
  publishedAt: string
  expiresAt: string
}
```

### PATCH /api/shorts/[id]

Update short metadata.

**Request:**
```typescript
{
  title?: string
  description?: string
  tags?: string[]
  ctaLink?: string
}
```

### DELETE /api/shorts/[id]

Delete draft short.

**Requirements:**
- Status must be DRAFT

---

## Dialog Components

### EditShortDialog

Modal for editing short metadata.

```typescript
interface EditShortDialogProps {
  short: Short
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

### ArchiveDialog

Confirmation dialog for archiving.

```typescript
interface ArchiveDialogProps {
  short: Short
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}
```

### DeleteDialog

Confirmation dialog for deleting drafts.

```typescript
interface DeleteDialogProps {
  short: Short
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}
```

---

## Usage Example

```tsx
import { ShortsTable } from '@/components/shorts/shorts-table'
import { ShortsFilters } from '@/components/shorts/shorts-filters'

export default function ShortsPage() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const { data: shorts } = useShorts({ status, search })

  return (
    <div>
      <ShortsFilters
        status={status}
        search={search}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />
      <ShortsTable
        shorts={shorts}
        onView={(id) => router.push(`/panel/shorts/${id}`)}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </div>
  )
}
```

---

## Related Documentation

- [Shorts Upload](./upload.md)
- [Publishing Workflow](./publishing.md)
- [Public Short View](./public-view.md)
- [Server Actions](../../api/server-actions/shorts.md)

---

**Implemented:** 2026-01-01
**Last Updated:** 2026-01-01
