# Etap 5: Interactions

**Projekt:** VideoShorts
**Priorytet:** P1 (High - Post-MVP)
**Zależności:** Etap 4 (Feed + Discovery)
**Szacowany czas:** 2 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

Dodanie warstwy społecznościowej: reakcje (like, emoji), komentarze z moderacją automatyczną (Perspective API), system followowania firm. To etap który zwiększa engagement i buduje community wokół platform.

---

## 2. Funkcjonalności

### 2.1 Reakcje (Likes & Emoji)

**Typy reakcji:**
- 👍 Like (public, widoczny licznik)
- 👎 Dislike (private, tylko do algorytmu)
- 🔥 Fire
- ❤️ Heart
- 😂 Laugh
- 😮 Wow
- 👏 Clap

**UI:**
- Button pod video player
- Click → toggle reakcja
- Long press / hover → emoji picker
- Animated counters
- Pokazuj "You liked this"

**Rate limiting:**
- Max 100 reakcji/min per user (spam protection)

### 2.2 Komentarze

**Features:**
- Max 500 znaków
- Markdown support (bold, italic, links)
- Threading: max 2 poziomy (komentarz → odpowiedź)
- Sortowanie: newest, oldest, most liked
- Edycja: do 15 min po publikacji
- Usuwanie: soft delete (author lub admin)

**Moderacja automatyczna:**
- Perspective API toxicity check (Google)
- Threshold: toxicityScore >= 0.7 → PENDING moderation
- Auto-approve jeśli < 0.7
- Pending comments: hidden, notification "Under review"

**Rate limiting:**
- Max 100 komentarzy/dzień per user

### 2.3 Follow Companies

**Features:**
- Follow button na company profile
- Unfollow button
- Lista obserwowanych w user profile
- Feed tab "Following" (z etapu 4)
- Powiadomienia o nowych shortsach (opcjonalne, etap 8)

**Stats:**
- Company profile: followers count
- User profile: following count

---

## 3. User Stories

### US-05-01: Like Short
**Jako** użytkownik
**Chcę** polubić short
**Aby** wyrazić zainteresowanie

**Kryteria akceptacji:**
- [ ] Like button pod video player
- [ ] Click → toggle like (on/off)
- [ ] Optimistic UI (instant feedback)
- [ ] Counter updates (+1/-1)
- [ ] Saved w DB (Like record created/deleted)
- [ ] Rate limiting: max 100/min

### US-05-02: Add Emoji Reaction
**Jako** użytkownik
**Chcę** zareagować emoji
**Aby** wyrazić emocje

**Kryteria akceptacji:**
- [ ] Long press like button → emoji picker
- [ ] Wybór emoji (🔥❤️😂😮👏) → zapisane
- [ ] Pokazuj "You reacted 🔥"
- [ ] Counters per emoji type
- [ ] Change reaction: poprzednia usunięta

### US-05-03: Add Comment
**Jako** użytkownik
**Chcę** dodać komentarz
**Aby** wyrazić opinię

**Kryteria akceptacji:**
- [ ] Comment input pod video (textarea, max 500 chars)
- [ ] Markdown support (bold, italic, links)
- [ ] Submit → Perspective API check
- [ ] Jeśli toxicityScore < 0.7: APPROVED, visible immediately
- [ ] Jeśli >= 0.7: PENDING, message "Under review"
- [ ] Rate limiting: 100/day
- [ ] Notification email do company (etap 8)

### US-05-04: Reply to Comment
**Jako** użytkownik
**Chcę** odpowiedzieć na komentarz
**Aby** kontynuować dyskusję

**Kryteria akceptacji:**
- [ ] Reply button na komentarzu
- [ ] Input field (inline)
- [ ] Max 1 poziom threadu (no replies to replies)
- [ ] Moderacja jak w US-05-03

### US-05-05: Follow Company
**Jako** użytkownik
**Chcę** obserwować firmę
**Aby** widzieć jej nowe shorty

**Kryteria akceptacji:**
- [ ] Follow button na company profile
- [ ] Click → Follow record created
- [ ] Button text: "Follow" → "Following"
- [ ] Company followers count +1
- [ ] User following list updated
- [ ] Feed tab "Following" pokazuje shorty z followed companies

---

## 4. Wymagania Techniczne

### 4.1 Database Schema

```prisma
enum LikeType {
  LIKE
  DISLIKE
  FIRE
  HEART
  LAUGH
  WOW
  CLAP
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  DELETED
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  shortId   String
  type      LikeType @default(LIKE)
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)

  @@unique([userId, shortId])
  @@index([userId])
  @@index([shortId])
  @@index([type])
}

model Comment {
  id            String        @id @default(cuid())
  userId        String
  shortId       String
  parentId      String?
  content       String        @db.Text
  status        CommentStatus @default(PENDING)
  toxicityScore Float?
  editedAt      DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  short   Short     @relation(fields: [shortId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies Comment[] @relation("CommentThread")

  @@index([userId])
  @@index([shortId])
  @@index([parentId])
  @@index([status])
  @@index([createdAt])
}

model Follow {
  id        String   @id @default(cuid())
  userId    String
  companyId String
  createdAt DateTime @default(now())

  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  company CompanyProfile @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
  @@index([userId])
  @@index([companyId])
}
```

### 4.2 API Endpoints

```
POST   /api/shorts/:id/like
DELETE /api/shorts/:id/like
GET    /api/shorts/:id/likes (counts per type)

GET    /api/shorts/:id/comments
POST   /api/shorts/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id

POST   /api/companies/:id/follow
DELETE /api/companies/:id/follow
GET    /api/users/me/following
```

### 4.3 Perspective API Integration

```typescript
// src/lib/perspective.ts
import { GoogleAuth } from 'google-auth-library';

export async function checkToxicity(text: string): Promise<number> {
  const response = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        languages: ['pl'],
        requestedAttributes: { TOXICITY: {} },
      }),
    }
  );

  const data = await response.json();
  return data.attributeScores.TOXICITY.summaryScore.value;
}
```

---

## 5. Kryteria Akceptacji

- [ ] User może like/unlike short
- [ ] User może wybrać emoji reakcję
- [ ] User może dodać komentarz (max 500 chars, markdown)
- [ ] Perspective API moderuje komentarze (toxicity >= 0.7 → PENDING)
- [ ] User może reply do komentarza (max 1 poziom)
- [ ] User może follow/unfollow company
- [ ] Feed tab "Following" pokazuje shorty z followed companies
- [ ] Rate limiting działa (100 comments/day, 100 likes/min)

---

## 6. Out of Scope

- ❌ Report system (Etap 6)
- ❌ Admin moderation queue (Etap 6)
- ❌ Powiadomienia (Etap 8)
- ❌ Like/comment notifications (Etap 8)

---

## 7. Zależności

- **Perspective API:** Google Cloud account, API key
- Etap 4: Feed, short view page

---

## 8. Harmonogram

### Tydzień 1: Likes + Comments
- **Dni 1-2:** Likes (UI, API, optimistic updates)
- **Dni 3-5:** Comments (form, Perspective API, threading)

### Tydzień 2: Follow + Polish
- **Dni 1-2:** Follow system, following feed tab
- **Dni 3-4:** Rate limiting, moderation UI
- **Dzień 5:** Testing, documentation

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
