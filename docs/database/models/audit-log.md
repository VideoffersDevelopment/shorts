# AuditLog Model

Model do śledzenia wszystkich akcji administracyjnych w systemie.

**Tabela:** `AuditLog`
**ORM:** Prisma
**Utworzono:** Stage 02 (task-01)
**Cel:** Compliance, debugging, security tracking

---

## Schema

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String
  targetType String
  targetId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([action])
  @@index([createdAt])
}
```

---

## Pola

| Pole | Typ | Nullable | Opis |
|------|-----|----------|------|
| `id` | String | ❌ | Primary key |
| `adminId` | String | ❌ | FK → User.id (kto wykonał) |
| `action` | String | ❌ | Nazwa akcji (enum-like) |
| `targetType` | String | ❌ | Typ obiektu (COMPANY, CATEGORY) |
| `targetId` | String | ❌ | ID obiektu |
| `metadata` | Json | ✅ | Dodatkowe dane akcji |
| `createdAt` | DateTime | ❌ | Kiedy wykonano |

---

## Action Types

### Company Actions

| Action | Target Type | Metadata |
|--------|-------------|----------|
| `UPDATE_COMPANY_STATUS` | COMPANY | `{ previousStatus, newStatus, reason? }` |
| `VERIFY_COMPANY` | COMPANY | `{ nip, companyName }` |
| `SUSPEND_COMPANY` | COMPANY | `{ reason }` |

### Category Actions

| Action | Target Type | Metadata |
|--------|-------------|----------|
| `CREATE_CATEGORY` | CATEGORY | `{ name, parentId?, icon? }` |
| `UPDATE_CATEGORY` | CATEGORY | `{ previousName, newName, previousIcon?, newIcon? }` |
| `DELETE_CATEGORY` | CATEGORY | `{ deletedName, deletedSlug, hadChildren, hadCompanies }` |

### Future Actions (Planned)

| Action | Target Type | Metadata |
|--------|-------------|----------|
| `BAN_USER` | USER | `{ userId, reason, duration }` |
| `DELETE_SHORT` | SHORT | `{ shortId, reason }` |
| `FEATURE_FLAG_CHANGE` | SYSTEM | `{ flag, previousValue, newValue }` |

---

## Metadata Examples

### UPDATE_COMPANY_STATUS

```json
{
  "previousStatus": "ACTIVE",
  "newStatus": "SUSPENDED",
  "reason": "Spam complaints",
  "companyName": "Example Sp. z o.o.",
  "nip": "1234567890"
}
```

### CREATE_CATEGORY

```json
{
  "name": {
    "pl": "Gastronomia",
    "en": "Food & Beverage",
    "de": "Gastronomie",
    "es": "Gastronomía",
    "ru": "Гастрономия"
  },
  "slug": "gastronomia",
  "icon": "Utensils",
  "parentId": null
}
```

### DELETE_CATEGORY

```json
{
  "deletedName": {
    "pl": "Stara kategoria",
    "en": "Old Category"
  },
  "deletedSlug": "stara-kategoria",
  "hadChildren": false,
  "hadCompanies": 0
}
```

---

## Relacje

### → User (N:1)

```prisma
admin User @relation(fields: [adminId], references: [id], onDelete: Cascade)
```

**Cascade Delete:** Usunięcie User → usunięcie audit logs (GDPR compliance)

**Uwaga:** W praktyce admin users raczej nie są usuwani (deactivation zamiast deletion).

---

## Indexes

```sql
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
```

**Performance:**
- Szybkie lookup po adminId (kto co robił)
- Szybkie lookup po targetType + targetId (historia obiektu)
- Filtrowanie po action
- Sortowanie/paginacja po createdAt

---

## Przykłady

### Automatyczne tworzenie audit log

```typescript
// W każdej admin action:
async function updateCompanyStatus(data: UpdateStatusInput) {
  const session = await auth();

  // Update company...
  const updated = await prisma.companyProfile.update({ ... });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: 'UPDATE_COMPANY_STATUS',
      targetType: 'COMPANY',
      targetId: data.companyId,
      metadata: {
        previousStatus: 'ACTIVE',
        newStatus: data.status,
        reason: data.reason
      }
    }
  });

  return { success: true, data: updated };
}
```

### Pobranie historii obiektu

```typescript
const companyHistory = await prisma.auditLog.findMany({
  where: {
    targetType: 'COMPANY',
    targetId: 'comp_123'
  },
  include: {
    admin: {
      select: {
        email: true,
        name: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});

// Result:
// [
//   {
//     id: "log_1",
//     action: "UPDATE_COMPANY_STATUS",
//     metadata: { previousStatus: "ACTIVE", newStatus: "SUSPENDED" },
//     createdAt: "2025-12-22T10:00:00Z",
//     admin: { email: "admin@videoshorts.pl", name: "Admin User" }
//   },
//   ...
// ]
```

### Pobranie akcji admina

```typescript
const adminActions = await prisma.auditLog.findMany({
  where: {
    adminId: session.user.id,
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 100
});
```

### Statystyki akcji

```typescript
const actionStats = await prisma.auditLog.groupBy({
  by: ['action'],
  _count: {
    id: true
  },
  where: {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  }
});

// Result:
// [
//   { action: "UPDATE_COMPANY_STATUS", _count: { id: 45 } },
//   { action: "CREATE_CATEGORY", _count: { id: 12 } },
//   { action: "DELETE_CATEGORY", _count: { id: 3 } }
// ]
```

---

## UI Component (Planned)

### AuditLogViewer

**Route:** `/admin/audit` (future)

**Features:**
- Tabela z paginacją
- Filtry: adminId, action, targetType, date range
- Wyszukiwanie po targetId
- Export do CSV
- Detail view (metadata JSON viewer)

**Mock:**
```tsx
<AuditLogViewer
  filters={{
    adminId: 'user_123',
    action: 'UPDATE_COMPANY_STATUS',
    dateFrom: '2025-12-01',
    dateTo: '2025-12-31'
  }}
/>
```

---

## Retention Policy

### Current (Stage 02)

**Retention:** Unlimited (wszystkie logi przechowywane)

**Disk Usage:** ~1KB per entry → 1M entries ≈ 1GB

### Future (Planned)

**Retention:**
- Last 90 days: Full logs (all fields)
- 90-365 days: Compressed (metadata.summary only)
- 365+ days: Archived to S3 / deleted

**Implementation:**
```typescript
// Cron job (daily)
async function archiveOldLogs() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Archive to S3
  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoff } }
  });

  await s3.putObject({
    Bucket: 'videoshorts-audit-archive',
    Key: `audit-logs-${cutoff.toISOString()}.json`,
    Body: JSON.stringify(oldLogs)
  });

  // Delete from DB
  await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } }
  });
}
```

---

## Security & Compliance

### GDPR

**Right to be forgotten:**
- AuditLog.adminId cascade delete (gdy admin usunięty)
- targetId może pozostać (depersonalized logs)

**Data minimization:**
- metadata nie zawiera PII (oprócz niezbędnych identyfikatorów)

### Immutability

**No updates/deletes:**
- Brak update/delete operations (tylko create + automated archival)
- Historia nie może być zmieniana przez admins

**Exception:** Automated cleanup (retention policy)

---

## Testing

**Test Scenarios:**
- ✅ Auto-creation w admin actions
- ✅ Correct metadata format
- ✅ adminId powiązanie z sesją
- ✅ Chronological ordering
- ✅ Filtering/pagination

---

## Migration History

### Initial Schema (2025-12-15, task-01)

```sql
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
```

---

## Powiązana Dokumentacja

- [Admin Panel Feature](../../features/admin/README.md)
- [Admin Server Actions](../../api/server-actions/admin-companies.md)
- [User Model](./user.md)

---

**Utworzono:** 2025-12-16
**Ostatnia aktualizacja:** 2025-12-22
**Wersja:** 1.0
