# Etap 6: Moderation

**Projekt:** VideoShorts
**Priorytet:** P1 (High - Post-MVP)
**Zależności:** Etap 5 (Interactions)
**Szacowany czas:** 1-2 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

System moderacji: zgłaszanie nieodpowiednich treści przez użytkowników, kolejka moderacyjna dla adminów, akcje moderacyjne (approve/reject/ban), audit log wszystkich działań. To etap który zapewnia jakość i bezpieczeństwo platform.

---

## 2. Funkcjonalności

### 2.1 System Zgłoszeń (Reports)

**Co można zgłosić:**
- Shorty
- Komentarze

**Powody zgłoszenia:**
- Spam
- Inappropriate content (pornografia, przemoc)
- Misleading (fake news, oszustwo)
- Copyright infringement
- Other (custom reason)

**Report form:**
- Radio buttons z reasons
- Textarea dla custom description (max 500 chars)
- Submit → Report record created
- Notification do adminów (email + in-app)

**Auto-actions:**
- 10 unikalnych zgłoszeń tego samego shorta → auto-hide (status: UNDER_REVIEW)
- Email do firmy: "Your short has been flagged"
- Admin notification: high priority

### 2.2 Kolejka Moderacji (Admin)

**Dashboard:**
- Lista pending reports (table)
- Sortowanie: priority (liczba zgłoszeń DESC), date
- Filtry: type (short/comment), reason, status

**Report details:**
- Preview shorta lub komentarza
- Wszystkie zgłoszenia tego item (aggregated)
- Reporter history (ile zgłoszeń, ile approved)
- Target history (firma/user: ile previous flags)
- Perspective API score (jeśli comment)
- Internal notes (admin comments)

**Quick actions:**
- Approve (dismiss report, content stays)
- Reject content (hide/delete)
- Ban user (permanent disable account)
- Suspend user (temporary: 7/30/90 days)
- Warning (email notification, no action)

### 2.3 Content Moderation Actions

**Dla Shortów:**
- Approve: dismiss reports, short stays PUBLISHED
- Hide: status → UNDER_REVIEW, niewidoczny w feedzie
- Delete: soft delete, status → DELETED
- Ban company: user.role → BANNED, wszystkie shorty hidden

**Dla Komentarzy:**
- Approve: status → APPROVED (jeśli był PENDING)
- Reject: status → REJECTED, hidden
- Delete: soft delete, status → DELETED
- Ban user: user.role → BANNED, wszystkie comments hidden

**Email notifications:**
- Do reportera: "We reviewed your report, thank you"
- Do autora: "Your [content] was removed: [reason]"
- Do admina: audit log entry

### 2.4 User Moderation

**Ban (permanent):**
- User account disabled
- Login prevented
- Wszystkie shorty/comments hidden
- Email notification z reason

**Suspend (temporary):**
- Duration: 7, 30, 90 days
- User can view but not post/comment
- Auto-lift po expiry (cron job)
- Email notification z expiry date

**Warning:**
- Email notification tylko
- Zapisane w audit log
- 3 warnings → auto-suspend 7 days

### 2.5 Audit Log

**Zapisywane akcje:**
- Report created
- Report resolved (approved/rejected)
- Content moderated (hidden/deleted)
- User banned/suspended/warned
- All admin actions

**Audit entry:**
- Timestamp
- Admin user
- Action type
- Target (user/short/comment)
- Reason/notes
- Metadata (previous status, etc.)

**Viewer:**
- Admin dashboard: `/admin/audit`
- Filtry: admin, action type, target type, date range
- Search: target ID, user email
- Export CSV

---

## 3. User Stories

### US-06-01: Report Short
**Jako** użytkownik
**Chcę** zgłosić nieodpowiedni short
**Aby** pomóc utrzymać jakość platformy

**Kryteria akceptacji:**
- [ ] Button "Report" na short page
- [ ] Modal z form: reason (radio), description (textarea)
- [ ] Submit → Report created
- [ ] Success toast: "Thank you, we'll review this"
- [ ] Jeśli 10 unikalnych zgłoszeń → auto-hide short
- [ ] Admin notification (email + in-app)

### US-06-02: Report Comment
**Jako** użytkownik
**Chcę** zgłosić obraźliwy komentarz
**Aby** zgłosić naruszenie regulaminu

**Kryteria akceptacji:**
- [ ] Button "Report" na komentarzu (kebab menu)
- [ ] Analogiczny flow jak US-06-01

### US-06-03: Review Reports (Admin)
**Jako** admin
**Chcę** przejrzeć zgłoszenia
**Aby** podjąć decyzję moderacyjną

**Kryteria akceptacji:**
- [ ] Admin dashboard: `/admin/moderation`
- [ ] Lista pending reports (table)
- [ ] Click report → detail modal
- [ ] Preview content, aggregated reports, history
- [ ] Perspective API score (jeśli comment)
- [ ] Actions: Approve, Reject, Ban, Suspend, Warning

### US-06-04: Ban User (Admin)
**Jako** admin
**Chcę** zbanować użytkownika
**Aby** usunąć go z platformy

**Kryteria akceptacji:**
- [ ] Action: Ban user (w report detail lub user list)
- [ ] Confirmation modal z reason (required)
- [ ] Submit → user.role = BANNED
- [ ] Wszystkie shorty/comments hidden
- [ ] Email notification do użytkownika
- [ ] Audit log entry

---

## 4. Wymagania Techniczne

### 4.1 Database Schema

```prisma
enum ReportReason {
  SPAM
  INAPPROPRIATE
  MISLEADING
  COPYRIGHT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
}

model Report {
  id          String       @id @default(cuid())
  reporterId  String
  shortId     String?
  commentId   String?
  reason      ReportReason
  description String?      @db.Text
  status      ReportStatus @default(PENDING)
  resolvedBy  String?      // Admin userId
  resolvedAt  DateTime?
  createdAt   DateTime     @default(now())

  reporter  User     @relation("ReporterReports", fields: [reporterId], references: [id])
  short     Short?   @relation(fields: [shortId], references: [id])
  comment   Comment? @relation(fields: [commentId], references: [id])
  resolver  User?    @relation("ResolverReports", fields: [resolvedBy], references: [id])

  @@index([reporterId])
  @@index([shortId])
  @@index([commentId])
  @@index([status])
  @@index([createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // "BAN_USER", "DELETE_SHORT", "APPROVE_COMMENT", etc.
  targetType String   // "USER", "SHORT", "COMMENT"
  targetId   String
  reason     String?  @db.Text
  metadata   Json?    // {previousStatus, reportId, etc.}
  createdAt  DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### 4.2 API Endpoints

```
POST   /api/reports
  Body: {shortId?, commentId?, reason, description?}

GET    /api/admin/reports (list, filters)
GET    /api/admin/reports/:id
PATCH  /api/admin/reports/:id/resolve
  Body: {action: 'approve' | 'reject' | 'ban_user', reason?}

PATCH  /api/admin/users/:id/ban
PATCH  /api/admin/users/:id/suspend
PATCH  /api/admin/users/:id/warn

GET    /api/admin/audit (list, filters, export CSV)
```

---

## 5. Kryteria Akceptacji

- [ ] User może zgłosić short (reason, description)
- [ ] User może zgłosić komentarz
- [ ] 10 unikalnych zgłoszeń → auto-hide content
- [ ] Admin dashboard: lista pending reports
- [ ] Admin może review report (preview, history)
- [ ] Admin może approve/reject content
- [ ] Admin może ban/suspend/warn user
- [ ] Email notifications do reporter, author, admin
- [ ] Audit log zapisuje wszystkie akcje
- [ ] Audit log viewer w admin panel

---

## 6. Harmonogram

### Tydzień 1: Reports + Queue
- **Dni 1-2:** Report system (UI, API)
- **Dni 3-5:** Admin moderation queue, review UI

### Tydzień 2: Actions + Audit (opcjonalny)
- **Dni 1-2:** Moderation actions (ban, suspend, delete)
- **Dni 3-4:** Audit log (recording, viewer)
- **Dzień 5:** Testing, edge cases

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
