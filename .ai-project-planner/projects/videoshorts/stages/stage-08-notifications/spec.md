# Etap 8: Notifications + Lifecycle

**Projekt:** VideoShorts
**Priorytet:** P1 (High - Post-MVP)
**Zależności:** Etap 3 (Shorts + Payments), Etap 5 (Interactions)
**Szacowany czas:** 1-2 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

System powiadomień: email notifications (Resend + React Email templates), in-app notifications, oraz dopracowanie lifecycle shortsów (expiring reminders, auto-archivization, renewal flow). To etap który zamyka pętlę komunikacji z użytkownikami.

---

## 2. Funkcjonalności

### 2.1 Email Notifications (Resend)

**Templates (React Email):**

1. **Welcome Email** (po rejestracji)
   - Subject: "Witaj w VideoShorts! 🎉"
   - Content: welcome message, verify email CTA, next steps

2. **Email Verification**
   - Subject: "Zweryfikuj swój email"
   - Content: verification link (expires 24h), resend button

3. **Short Published**
   - Subject: "Twój short jest live! 🚀"
   - Content: short title, thumbnail, link, stats (initial: 0), social share buttons

4. **Short Expiring** (7 dni przed)
   - Subject: "Twój short wygasa za 7 dni"
   - Content: short title, stats (views, likes, comments), renew CTA, price (5 PLN)

5. **Short Archived**
   - Subject: "Twój short został zarchiwizowany"
   - Content: short title, final stats, renew option, link do archived

6. **Payment Confirmation**
   - Subject: "Płatność potwierdzona - faktura"
   - Content: payment details, invoice PDF link, short status

7. **Moderation Action**
   - Subject: "Twój [short/komentarz] został [usunięty/odrzucony]"
   - Content: reason, appeal option (link do support), guidelines reminder

8. **New Follower** (opcjonalne, może być spammy)
   - Subject: "Masz nowego followera!"
   - Content: follower name, avatar, link do profilu

9. **Comment Reply** (opcjonalne)
   - Subject: "[User] odpowiedział na Twój komentarz"
   - Content: original comment, reply, link do shorta

**Unsubscribe:**
- Link w footer każdego emaila
- User preferences: `/settings/notifications`
- Granular control: disable per type (followers, comments, etc.)
- Essential emails (payment, moderation) nie można wyłączyć

**Rate limiting:**
- Max 10 emails/day per user (spam protection)
- Batch digest dla multiple events (np. 5 new followers → 1 email)

### 2.2 In-App Notifications

**Notification types:**
- SHORT_PUBLISHED (do firmy)
- SHORT_EXPIRING (do firmy, 7 dni przed)
- SHORT_ARCHIVED (do firmy)
- NEW_FOLLOWER (do firmy)
- COMMENT_REPLY (do user)
- COMMENT_ON_SHORT (do firmy)
- LIKE_ON_SHORT (batched, "X people liked your short")
- MODERATION_ACTION (do user)
- PAYMENT_SUCCESS (do firmy)

**UI:**
- Bell icon w header (unread count badge)
- Dropdown panel (click bell)
- Lista notifications (newest first, max 50)
- Mark as read (individual lub bulk)
- Link do related content (short, comment, profile)
- Auto-mark as read po 7 dniach

**Real-time updates:**
- Polling (co 30s, gdy user aktywny)
- Lub Server-Sent Events (SSE) - post-MVP
- Lub WebSocket - post-MVP

**Persistence:**
- Max 50 notifications per user (FIFO, auto-delete oldest)
- Mark all as read button
- Clear all button (soft delete)

### 2.3 Notification Preferences

**Settings page: `/settings/notifications`**

**Email preferences:**
- ☑ Short published
- ☑ Short expiring (7 days before)
- ☑ Short archived
- ☐ New follower (default: off, może być spammy)
- ☐ Comment reply (default: off)
- ☑ Payment confirmation (cannot disable)
- ☑ Moderation actions (cannot disable)

**In-app preferences:**
- ☑ Enable in-app notifications (master toggle)
- Granular per type (same jako email)

**Digest mode (post-MVP):**
- Daily digest (batch all notifications → 1 email per day)
- Weekly digest

### 2.4 Lifecycle Events (Enhanced z Etapu 3)

**Expiring reminder flow:**
```
Day 23 (7 days before expiry):
  → Inngest cron job finds expiring shorts
  → Send email + in-app notification
  → CTA: "Renew for 5 PLN"

Day 27:
  → Reminder #2 (email only, "3 days left")

Day 30:
  → Auto-archive (status → ARCHIVED)
  → Email + in-app notification
  → CTA: "Renew now to restore visibility"
```

**Background jobs (Inngest):**
- `shorts.expiring.scan` (cron: daily 9 AM)
- `shorts.expiring.reminder` (event-driven)
- `shorts.archive.expired` (cron: daily 3 AM)
- `notifications.send.email` (event-driven, retry logic)
- `notifications.cleanup` (cron: weekly, delete > 30 days)

---

## 3. User Stories

### US-08-01: Receive Email (Short Published)
**Jako** firma
**Chcę** otrzymać email gdy short jest live
**Aby** wiedzieć że publikacja się udała

**Kryteria akceptacji:**
- [ ] Po publish (etap 3): Inngest event `short.published`
- [ ] Email sent (Resend): "Your short is live!"
- [ ] Content: title, thumbnail, link, stats (0), social share
- [ ] Unsubscribe link w footer
- [ ] Delivered < 1 min

### US-08-02: Receive Email (Short Expiring)
**Jako** firma
**Chcę** otrzymać email 7 dni przed wygaśnięciem
**Aby** zdążyć odnowić short

**Kryteria akceptacji:**
- [ ] Cron job (daily 9 AM): scan expiring shorts (expiresAt in 7 days)
- [ ] Email sent: "Your short expires in 7 days"
- [ ] Content: title, stats (views, likes, comments), renew CTA
- [ ] CTA link: direct to Payment Gateway Checkout (renewal flow)
- [ ] Reminder #2: 3 days before (Day 27)

### US-08-03: View In-App Notifications
**Jako** użytkownik
**Chcę** zobaczyć powiadomienia in-app
**Aby** nie przegapić ważnych eventów

**Kryteria akceptacji:**
- [ ] Bell icon w header (unread count badge)
- [ ] Click → dropdown panel (max 50 notifications)
- [ ] Każde notification: icon, message, time ago, link
- [ ] Mark as read (click notification lub mark all button)
- [ ] Auto-refresh (polling 30s)
- [ ] Empty state: "No new notifications"

### US-08-04: Manage Notification Preferences
**Jako** użytkownik
**Chcę** zarządzać preferencjami powiadomień
**Aby** otrzymywać tylko to co mnie interesuje

**Kryteria akceptacji:**
- [ ] Settings page: `/settings/notifications`
- [ ] Email preferences: checkboxes per type
- [ ] In-app preferences: checkboxes per type
- [ ] Save button → update UserProfile.preferences
- [ ] Essential emails (payment, moderation) cannot be disabled (checkboxes disabled)
- [ ] Unsubscribe link w emailu → auto-update preferences

---

## 4. Wymagania Techniczne

### 4.1 Database Schema

```prisma
enum NotificationType {
  WELCOME
  VERIFY_EMAIL
  SHORT_PUBLISHED
  SHORT_EXPIRING
  SHORT_ARCHIVED
  PAYMENT_CONFIRMATION
  MODERATION_ACTION
  NEW_FOLLOWER
  COMMENT_REPLY
  COMMENT_ON_SHORT
  LIKE_ON_SHORT
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String           @db.Text
  link      String?          // URL do related content
  metadata  Json?            // {shortId, commentId, etc.}
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([read])
  @@index([createdAt])
}
```

### 4.2 Email Templates (React Email)

```tsx
// emails/ShortPublished.tsx
import { Html, Body, Container, Heading, Text, Button, Img } from '@react-email/components';

export default function ShortPublished({ short, company }) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Your short is live! 🚀</Heading>
          <Img src={short.thumbnailUrl} width="400" alt={short.title} />
          <Text>"{short.title}" is now visible to users.</Text>
          <Button href={`${baseUrl}/shorts/${short.id}`}>View Short</Button>
          <Text>
            Stats: {short.stats.views} views, {short.stats.likes} likes
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### 4.3 Notification Service

```typescript
// src/services/notifications.ts

export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
  sendEmail = true,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  sendEmail?: boolean;
}) {
  // Check user preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  const prefs = user.profile.preferences;
  const emailEnabled = prefs?.email?.[type] !== false; // Opt-out
  const inAppEnabled = prefs?.inApp?.[type] !== false;

  // Create in-app notification
  if (inAppEnabled) {
    await prisma.notification.create({
      data: { userId, type, title, message, link, metadata },
    });
  }

  // Send email
  if (sendEmail && emailEnabled) {
    await inngest.send({
      name: 'notification.email.send',
      data: { userId, type, title, message, link, metadata },
    });
  }
}
```

### 4.4 Inngest Jobs

```typescript
// Email sending job (with retry)
inngest.createFunction(
  { name: 'notification.email.send', retries: 3 },
  { event: 'notification.email.send' },
  async ({ event }) => {
    const { userId, type, ...data } = event.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const template = emailTemplates[type]; // React Email template

    await resend.emails.send({
      from: 'VideoShorts <noreply@videoshorts.pl>',
      to: user.email,
      subject: template.subject(data),
      react: template.render(data),
    });
  }
);

// Cleanup old notifications (weekly cron)
inngest.createFunction(
  { name: 'notifications.cleanup' },
  { cron: '0 0 * * 0' }, // Sunday midnight
  async () => {
    await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: subDays(new Date(), 30) },
      },
    });
  }
);
```

### 4.5 API Endpoints

```
GET    /api/notifications (list, pagination, filters)
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
DELETE /api/notifications/clear-all

GET    /api/users/me/preferences/notifications
PATCH  /api/users/me/preferences/notifications
  Body: {email: {SHORT_PUBLISHED: true, ...}, inApp: {...}}

POST   /api/unsubscribe/:token (from email link)
```

---

## 5. Kryteria Akceptacji

- [ ] Email templates (React Email) dla wszystkich typów
- [ ] Email sending działa (Resend, retry logic)
- [ ] In-app notifications (bell icon, dropdown, unread count)
- [ ] Mark as read działa (individual, bulk)
- [ ] Notification preferences page
- [ ] Unsubscribe link w emailach
- [ ] Rate limiting: max 10 emails/day per user
- [ ] Expiring reminders (7 days, 3 days before)
- [ ] Auto-archive cron job
- [ ] Cleanup old notifications (30 days)

---

## 6. Zależności

- **Resend:** Email delivery (etap 1 setup)
- **React Email:** Templates (install @react-email/*)
- Inngest: Background jobs
- Etap 3: Short lifecycle events
- Etap 5: Interaction events (likes, comments, follows)

---

## 7. Harmonogram

### Tydzień 1: Email Templates + Sending
- **Dni 1-2:** React Email templates (9 types)
- **Dni 3-4:** Notification service, Inngest jobs, Resend integration
- **Dzień 5:** Expiring reminders flow, testing

### Tydzień 2: In-App + Preferences (opcjonalny)
- **Dni 1-2:** In-app notifications (UI, API, polling)
- **Dni 3-4:** Preferences page, unsubscribe flow
- **Dzień 5:** Cleanup jobs, testing, polish

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
