# Plan Implementacji: System Portfela SPV (Ledger) — Wersja Finalna

**Wersja:** 1.0 Final
**Data:** 2026-03-18
**Podejście:** Vertical Slices + TDD
**Bazowy dokument:** `payment-modification.md` v3.0

---

## 1. Podsumowanie Decyzji Projektowych

### 1.1. Scope MVP

| Funkcja | MVP? | Komentarz |
|---|---|---|
| Dual Wallet (PROMO/MAIN) | TAK | Fundament systemu |
| WalletService (FIFO) | TAK | Core engine |
| Nowe pakiety punktowe (×10) | TAK | 10k/50k/100k/500k pkt |
| Video Lifecycle (EXPIRED) | TAK | 2-fazowy cykl życia |
| Extension Boost (przedłużanie) | TAK | Cennik progresywny |
| Boost Standard | TAK | Tylko Standard (80 pkt) |
| Super Like (napiwki) | TAK | Transfer A→B |
| Grant Expiration (60d PROMO) | TAK | Cron Inngest |
| Maintenance Fee (500 pkt/mc) | TAK | Cron Inngest |
| Retention Notifications | TAK | 6 email templates (Resend) |
| Admin Wallet UI | TAK | Dedykowany panel |
| **Konfigurowalny cennik w admin** | **TAK** | **Wszystkie ceny usług edytowalne z panelu** |
| Premium Status (Standard/Premium/Business) | NIE | Osobny etap |
| Boost Geo/National/Demographic | NIE | Osobny etap |
| Push Notifications (Web Push/FCM) | NIE | Osobny etap |
| Watermark Removal (50 pkt) | NIE | Osobny etap |
| 4K Upload (100 pkt) | NIE | Osobny etap |
| Link w Bio (500 pkt) | NIE | Osobny etap |

### 1.2. Finalna Tabela Cenowa

#### Pakiety zakupowe (×10 od dokumentu źródłowego)

| ID | Pakiet | Punkty | Cena PLN | Grosze | Rabat |
|---|---|---|---|---|---|
| `starter` | Starter | 10 000 | 15.00 | 1 500 | - |
| `standard` | Standard | 50 000 | 65.00 | 6 500 | ~7% |
| `premium` | Premium | 100 000 | 120.00 | 12 000 | ~20% |
| `business` | Business | 500 000 | 500.00 | 50 000 | ~33% |

#### Koszty usług (wartości domyślne — konfigurowalne z panelu admina)

| Klucz konfiguracji | Usługa | Koszt domyślny | MVP? |
|---|---|---|---|
| `PUBLICATION` | Publikacja wideo | 100 pkt | TAK |
| `BOOST_STD` | Boost Standard | 80 pkt | TAK |
| `EXTENSION_30D` | Przedłużenie +30 dni | 500 pkt | TAK |
| `EXTENSION_3M` | Przedłużenie +3 miesiące | 1 350 pkt | TAK |
| `EXTENSION_6M` | Przedłużenie +6 miesięcy | 2 500 pkt | TAK |
| `EXTENSION_12M` | Przedłużenie +12 miesięcy | 4 500 pkt | TAK |
| `SUPER_LIKE` | Super Like (napiwek) | 100 pkt | TAK |
| `MAINTENANCE_FEE` | Opłata utrzymaniowa/mc | 500 pkt | TAK |
| `WATERMARK_RM` | Usunięcie znaku wodnego | 50 pkt | NIE |
| `UPLOAD_4K` | Upload 4K/60fps | 100 pkt | NIE |
| `LINK_BIO` | Link w Bio (30 dni) | 500 pkt | NIE |

> **Kluczowa zmiana:** Wszystkie ceny usług przechowywane w tabeli `PricingConfig` z panelem admina
> do edycji. Stałe w kodzie służą TYLKO jako wartości domyślne (seed). WalletService pobiera cenę
> z DB (z cache'em in-memory) przed każdą operacją spend.

#### Granty i przeliczniki

| Element | Wartość |
|---|---|
| PROMO grant (onboarding COMPANY) | 1 000 pkt |
| PROMO ważność | 60 dni (sztywna, nieodnawialna) |
| Przelicznik retencyjny | 1 pkt ≈ 0.0015 PLN |
| Min. top-up | 15 PLN |
| Maintenance Fee próg | 12 mc braku aktywności |
| Spending reset | +6 mc do `expiresAt` |
| Top-up (Premium) reset | +12 mc do WSZYSTKICH partii MAIN |

### 1.3. Decyzje Architektoniczne

| Decyzja | Rozstrzygnięcie |
|---|---|
| Premium Status | Pomijamy w MVP |
| Push Notifications | Pomijamy — tylko email (Resend) |
| Admin wallet UI | TAK, dedykowany panel |
| PROMO grant trigger | Przy rejestracji COMPANY (zmiana roli USER → COMPANY) |
| Migracja starych danych | Czyścimy (brak real users) |
| `User.publicationCredits` | Usuwamy w migracji (breaking change) |
| `Payment.shortId` | Usuwamy (pakiety ≠ konkretny short) |
| Stare `CreditTransaction` | Usuwamy (faza wdrożenia) |
| Concurrent spending | Pesymistyczne blokowanie (`SELECT FOR UPDATE` w `$transaction`) |
| Podejście dev | Vertical Slices + TDD |
| Utility features | NIE w MVP |
| Cennik usług | Konfigurowalny z panelu admina (DB + cache) |

---

## 2. Architektura Danych (Prisma Schema)

### 2.1. Nowe ENUMy

```prisma
enum WalletType {
  PROMO    // Portfel Promocyjny — darmowe, 60 dni, nieodnawialne
  MAIN     // Portfel Główny — kupione, 12 mc, odnawialne
}

enum CreditBatchType {
  PROMO_GRANT   // Darmowe na start (onboarding COMPANY)
  PURCHASED     // Kupione za PLN (P24/Tpay)
  BONUS         // Gratis do pakietu (admin grant)
  EARNED_TIP    // Napiwki od innych (Super Like)
}

enum CreditActionType {
  PUBLICATION      // Opłata za publikację wideo (100 pkt)
  EXTENSION        // Przedłużenie emisji wideo
  BOOST_STD        // Boost standardowy (80 pkt)
  SUPER_LIKE       // Napiwek dla innego użytkownika (100 pkt)
  MAINTENANCE_FEE  // Opłata utrzymaniowa (500 pkt/mc)
  REFUND           // Zwrot za nieudane przetwarzanie
  PROMO_EXPIRED    // Wygaśnięcie partii PROMO (zerowanie)
  ADMIN_GRANT      // Grant od admina
  ADMIN_FREEZE     // Zamrożenie partii (chargeback)
}
```

### 2.2. Nowe modele

```prisma
model CreditBatch {
  id              String          @id @default(cuid())
  userId          String
  wallet          WalletType
  type            CreditBatchType
  initialAmount   Int
  currentBalance  Int
  createdAt       DateTime        @default(now()) @db.Timestamptz(6)
  expiresAt       DateTime        @db.Timestamptz(6)
  lastActivityAt  DateTime        @default(now()) @db.Timestamptz(6)
  isFrozen        Boolean         @default(false)

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    CreditTransaction[]

  @@index([userId, wallet])
  @@index([expiresAt])
  @@index([userId, currentBalance])
}

model PricingConfig {
  id           String   @id @default(cuid())
  key          String   @unique   // np. "PUBLICATION", "BOOST_STD"
  label        String              // Nazwa wyświetlana w admin UI
  description  String?             // Opis dla admina
  cost         Int                 // Koszt w punktach
  enabled      Boolean  @default(true)  // Czy usługa aktywna
  category     String   @default("general")  // Grupowanie w UI
  updatedAt    DateTime @updatedAt @db.Timestamptz(6)
  updatedBy    String?             // ID admina który zmienił

  @@index([key])
  @@index([category])
}

model NotificationLog {
  id          String   @id @default(cuid())
  userId      String
  triggerType String
  batchId     String?
  channel     String   // "EMAIL"
  sentAt      DateTime @default(now()) @db.Timestamptz(6)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, triggerType, batchId])
  @@index([userId])
  @@index([triggerType])
}

model ShortBoost {
  id        String    @id @default(cuid())
  shortId   String
  userId    String
  type      String    @default("STANDARD")  // na przyszłość: GEO, NATIONAL, DEMOGRAPHIC
  cost      Int
  startedAt DateTime  @default(now()) @db.Timestamptz(6)
  expiresAt DateTime  @db.Timestamptz(6)
  status    String    @default("ACTIVE")  // ACTIVE, COMPLETED, CANCELLED

  short     Short     @relation(fields: [shortId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([shortId])
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
}
```

### 2.3. Modyfikacje istniejących modeli

```
User:
  - USUNĄĆ: publicationCredits
  - DODAĆ: creditBatches        CreditBatch[]
  - DODAĆ: notificationLogs     NotificationLog[]
  - DODAĆ: shortBoosts          ShortBoost[]

CreditTransaction:
  - USUNĄĆ: source (CreditSource enum)
  - DODAĆ:  actionType  CreditActionType
  - DODAĆ:  batchId     String?  (FK → CreditBatch)
  - DODAĆ:  batch       CreditBatch? @relation(...)

Short:
  - DODAĆ: boosts  ShortBoost[]

ShortStatus enum:
  - DODAĆ: EXPIRED  (między PUBLISHED a ARCHIVED)

Payment:
  - USUNĄĆ: shortId (pakiety ≠ konkretny short)
  - USUNĄĆ: relacja short

USUNĄĆ CAŁY ENUM: CreditSource (zastąpiony przez CreditActionType)
```

---

## 3. Vertical Slices — Szczegółowy Plan

### VS1: Fundament DB + WalletService Core

**Cel:** Nowy schemat danych + silnik portfela z pełnym pokryciem testami.

**Priorytet:** KRYTYCZNY — blokuje wszystko inne.

#### Zadania:

**1. Prisma Schema (migracja)**
- Nowe enumy: `WalletType`, `CreditBatchType`, `CreditActionType`
- Nowy model: `CreditBatch`
- Nowy model: `PricingConfig`
- Modyfikacja `CreditTransaction`: dodać `batchId`, `actionType`; usunąć `source`
- Modyfikacja `User`: usunąć `publicationCredits`, dodać relacje
- Dodać `EXPIRED` do `ShortStatus`
- Usunąć `shortId` z `Payment`
- Usunąć enum `CreditSource`
- Seed: wartości domyślne do `PricingConfig`

**2. WalletService (`src/lib/wallet/`)**
- `wallet-types.ts` — interfejsy i typy
- `wallet-constants.ts` — wartości domyślne (fallback jeśli DB pusta)
- `pricing-service.ts` — odczyt cen z `PricingConfig` (z cache in-memory, TTL 5 min)
- `wallet-service.ts` — metody:
  - `getWalletBalance(userId)` → `WalletBalanceResult`
  - `addCredits(userId, wallet, type, amount, options?)` → `CreditBatch`
  - `spendCredits(userId, amount, actionType, relatedVideoId?)` → `SpendResult`
  - `topUp(userId, amount, paymentId)` → `CreditBatch` (+ Premium Reset)
  - `refundToExactBatch(userId, batchId, amount)` → void
  - `freezeBatch(batchId, adminId, reason)` → void
  - `unfreezeBatch(batchId, adminId)` → void

**3. Testy TDD (`src/lib/wallet/__tests__/`)**

Scenariusze (pisane PRZED implementacją):

| # | Scenariusz | Oczekiwany wynik |
|---|---|---|
| 1 | User ma 100 PROMO + 200 MAIN, wydaje 50 | Odjęte z PROMO, MAIN nietknięty |
| 2 | User ma 30 PROMO + 200 MAIN, wydaje 80 | 30 z PROMO + 50 z MAIN |
| 3 | User ma 2 partie MAIN (exp. luty i marzec), wydaje 50 | Najpierw z lutowej (FIFO) |
| 4 | User ma partię `is_frozen = true` + normalną | Frozen pominięta |
| 5 | Spending → `expires_at` MAIN = max(obecny, NOW+6mc) | Reset nie cofa daty |
| 6 | Top-up → WSZYSTKIE partie MAIN expires_at = NOW+12mc | Nawet stare partie |
| 7 | User ma 0 punktów, próbuje wydać | Error: "Insufficient credits" |
| 8 | User ma PROMO wygasłe + MAIN aktywne | PROMO pominięte, bierze z MAIN |
| 9 | Maintenance Fee, user ma 30 pkt MAIN | Pobranie 30 (nie 500), wyzerowanie |
| 10 | Refund do wygasłej partii | Refund przywraca punkty mimo wygaśnięcia |
| 11 | PricingService zwraca cenę z DB | Poprawna cena, cache działa |
| 12 | Admin zmienia cenę → cache się odświeża | Po TTL nowa cena |

**Pliki:**
```
prisma/schema.prisma                        🔴 HEAVY
prisma/seed.ts                              🔴 NOWY (seed PricingConfig)
src/lib/wallet/
├── wallet-types.ts                         🔴 NOWY
├── wallet-constants.ts                     🔴 NOWY
├── wallet-service.ts                       🔴 NOWY
├── pricing-service.ts                      🔴 NOWY
└── __tests__/
    ├── wallet-service.test.ts              🔴 NOWY
    └── pricing-service.test.ts             🔴 NOWY
```

---

### VS2: Payment Flow End-to-End

**Cel:** Nowy flow zakupu pakietów punktowych z dual wallet response.

**Zależności:** VS1

#### Zadania:

**1. Aktualizacja cennika (`src/lib/payments/index.ts`)**
- Nowe pakiety: `POINT_PACKAGES` (10k/50k/100k/500k)
- Usunąć: `CREDIT_PACKAGES`, `PRICE_PER_CREDIT`
- Nowy przelicznik: `POINTS_TO_PLN_RATE = 0.0015`
- Funkcja: `pointsToApproxPLN(points)`

**2. Aktualizacja checkout (`src/app/api/payments/checkout/route.ts`)**
- Walidacja nowych pakietów (min. 15 PLN)
- Body: `{ packageId: 'starter' | 'standard' | 'premium' | 'business', provider: 'PRZELEWY24' | 'TPAY' }`
- Tworzenie `Payment` BEZ `shortId`
- Aktualizacja `creditsGranted` na ilość punktów

**3. Aktualizacja webhooków**
- `webhooks/przelewy24/route.ts` → `walletService.topUp(userId, points, paymentId)`
- `webhooks/tpay/route.ts` → jw.
- Usunąć logikę `publicationCredits`

**4. Przebudowa API credits (`src/app/api/credits/route.ts`)**
- Nowa odpowiedź: `{ promo: {...}, main: {...}, total, batches: [...], recentTransactions: [...] }`
- Używa `walletService.getWalletBalance(userId)`

**5. Nowy endpoint: `POST /api/wallet/top-up`**
- Alias/wrapper na checkout z nowymi pakietami
- Walidacja min. 15 PLN

**6. UI: Panel kredytów (`panel/credits/page.tsx`)**
- Dwa portfele (PROMO + MAIN) z paskami ważności
- Historia transakcji z info o partii
- Badge ostrzegawcze (maintenance fee, wygasanie)

**7. UI: Nowy checkout modal**
- Wybór pakietu (4 opcje z rabatami)
- Info "Wpłata resetuje ważność WSZYSTKICH punktów o 12mc"
- Wybór providera (P24/Tpay)

**8. Testy:**
- Checkout flow (walidacja pakietów, min. kwota)
- Webhook → topUp integration
- API credits response format
- UI component tests

**Pliki:**
```
src/lib/payments/index.ts                   🟡 REFAKTOR
src/app/api/payments/checkout/route.ts      🟡 REFAKTOR
src/app/api/webhooks/przelewy24/route.ts    🟡 REFAKTOR
src/app/api/webhooks/tpay/route.ts          🟡 REFAKTOR
src/app/api/credits/route.ts                🔴 PRZEBUDOWA
src/app/api/wallet/top-up/route.ts          🔴 NOWY
src/app/(main)/[locale]/panel/credits/      🔴 PRZEBUDOWA
src/components/payments/                    🔴 PRZEBUDOWA
```

---

### VS3: Publikacja z Wallet + PROMO Onboarding

**Cel:** Podłączenie publikacji do WalletService + automatyczny grant PROMO.

**Zależności:** VS1

#### Zadania:

**1. Refaktor `publication-controller.ts`**
- `deductCredit()` → `walletService.spendCredits(userId, await pricingService.getPrice('PUBLICATION'), 'PUBLICATION', shortId)`
- `addCredits()` → `walletService.addCredits(userId, 'MAIN', mapType(source), amount)`
- `addCreditsFromPayment()` → `walletService.topUp(userId, amount, paymentId)`
- `getCreditBalance()` → `walletService.getWalletBalance(userId)`
- `refundCredit()` → `walletService.refundToExactBatch(userId, batchId, amount)`
- `initiatePublication()` — zmienić check credits na `walletService.getWalletBalance()`

**2. Aktualizacja Qencode webhook (`webhooks/qencode/route.ts`)**
- Refund: znaleźć `batchId` z `CreditTransaction` dla danego `shortId`
- `walletService.refundToExactBatch(userId, batchId, refundAmount)`

**3. PROMO grant przy rejestracji COMPANY**
- W logice zmiany roli USER → COMPANY (akcja upgrade lub rejestracja firmy):
  ```
  walletService.addCredits(userId, 'PROMO', 'PROMO_GRANT', 1000, {
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)  // +60 dni
  })
  ```
- Guardrail: sprawdzenie czy user nie dostał już PROMO (`CreditBatch WHERE type = PROMO_GRANT AND userId = X`)

**4. UI: Powitalny banner po rejestracji COMPANY**
- "Dostałeś 1 000 darmowych punktów! Masz 60 dni na ich wykorzystanie."

**5. Nowy endpoint: `POST /api/wallet/spend`**
- Body: `{ amount: number, actionType: CreditActionType, shortId?: string }`
- Deleguje do `walletService.spendCredits()`
- Używany przez frontend do boostów, extensions itp.

**6. Testy:**
- Publikacja z PROMO credits (FIFO: najpierw PROMO)
- Publikacja bez credits → `requiresPayment: true`
- Refund do konkretnej partii
- PROMO grant jednorazowy (guardrail)
- Spend endpoint walidacja

**Pliki:**
```
src/lib/publication/publication-controller.ts   🔴 REFAKTOR
src/app/api/webhooks/qencode/route.ts           🟡 REFAKTOR
src/app/api/wallet/spend/route.ts               🔴 NOWY
src/components/shorts/publish-dialog.tsx         🟡 REFAKTOR
(logika rejestracji COMPANY)                     🟡 REFAKTOR
```

---

### VS4: Video Lifecycle (EXPIRED + Extension)

**Cel:** 2-fazowy cykl życia wideo z możliwością przedłużenia.

**Zależności:** VS1

#### Zadania:

**1. Przebudowa `archive-expired.ts` → dwie funkcje Inngest:**

*Nowa: `expire-published-shorts`*
```
Cron: 0 3 * * * (codziennie o 3:00)
Query: shorts WHERE status = PUBLISHED AND expiresAt < NOW()
Action: UPDATE status = EXPIRED
```

*Zmodyfikowana: `deep-archive-expired`*
```
Cron: 0 5 1 * * (1-szego miesiąca o 5:00)
Query: shorts WHERE status = EXPIRED AND expiresAt < NOW() - 12 months
Action:
  1. Kasowanie plików z R2 (mp4, thumbnails, HLS)
  2. UPDATE status = ARCHIVED, archivedAt = NOW()
```

**2. Aktualizacja filtrów publicznych**
- Feed, search, mapa: `status = PUBLISHED` (EXPIRED nie pojawia się)
- Panel "Moje Wideo": pokazuje EXPIRED z przyciskiem "PRZEDŁUŻ"

**3. Extension Boost (przedłużanie emisji)**
- API: `POST /api/shorts/[id]/extend`
- Body: `{ period: '30D' | '3M' | '6M' | '12M' }`
- Logika: pobierz cenę z `PricingConfig`, `spendCredits()`, update `Short.expiresAt`, `status = PUBLISHED`
- Cennik progresywny (z PricingConfig):
  - +30d = 500 pkt, +3mo = 1 350, +6mo = 2 500, +12mo = 4 500

**4. UI: Panel wideo — nowy status EXPIRED**
- Badge EXPIRED (czerwony) z "wygasł X dni temu"
- Przycisk "PRZEDŁUŻ EMISJĘ" → modal z cennikiem
- ARCHIVED → wyszarzony, "pliki usunięte"

**5. Testy:**
- Cron: PUBLISHED → EXPIRED po 30d
- Cron: EXPIRED → ARCHIVED po 12mc (+ kasowanie R2)
- Extension: EXPIRED → PUBLISHED po zapłacie
- Extension: brak punktów → redirect do checkout
- Filtr: EXPIRED nie pojawia się w feedzie/search

**Pliki:**
```
src/lib/inngest/functions/archive-expired.ts    🔴 PRZEBUDOWA → 2 funkcje
src/lib/inngest/functions/expire-shorts.ts      🔴 NOWY
src/lib/inngest/functions/deep-archive.ts       🔴 NOWY
src/lib/inngest/events.ts                       🟡 Nowe eventy
src/lib/inngest/functions/index.ts              🟡 Rejestracja
src/app/api/shorts/[id]/extend/route.ts         🔴 NOWY
src/app/(main)/[locale]/panel/shorts/           🟡 UI update
src/components/shorts/extension-modal.tsx        🔴 NOWY
```

---

### VS5: Boost Standard

**Cel:** Promocja wideo — tylko wariant Standard (80 pkt, konfigurowalny).

**Zależności:** VS1, VS3 (endpoint spend)

#### Zadania:

**1. Model `ShortBoost`** (już w VS1 schema)

**2. API: `POST /api/shorts/[id]/boost`**
- Walidacja: short musi być PUBLISHED, user = właściciel
- Pobierz cenę z `PricingConfig` (klucz: `BOOST_STD`, domyślnie 80 pkt)
- `walletService.spendCredits(userId, cost, 'BOOST_STD', shortId)`
- Utwórz `ShortBoost` (status: ACTIVE, expiresAt: NOW + 24h)

**3. Feed scoring: priorytet dla boosted shorts**
- W `feed-scoring.ts`: jeśli short ma aktywny boost (ShortBoost WHERE status = ACTIVE AND expiresAt > NOW), dodaj bonus do score
- Cron/logika: oznacz boost jako COMPLETED gdy `expiresAt < NOW()`

**4. UI: Modal "Promuj Wideo"**
- Dostępny z panelu "Moje Wideo" przy shortach PUBLISHED
- Wyświetla cenę z PricingConfig
- Przycisk "Zapłać i Promuj"
- Info o czasie trwania (24h)

**5. Testy:**
- Boost na PUBLISHED short → sukces
- Boost na EXPIRED → error
- Boost bez credits → error
- Feed scoring: boosted short wyżej
- Boost expiry: ACTIVE → COMPLETED po 24h

**Pliki:**
```
src/app/api/shorts/[id]/boost/route.ts       🔴 NOWY
src/lib/utils/feed-scoring.ts                🟡 Dodanie boost score
src/components/shorts/boost-modal.tsx         🔴 NOWY
```

---

### VS6: Super Like (Napiwki)

**Cel:** Transfer punktów między użytkownikami (closed loop).

**Zależności:** VS1

#### Zadania:

**1. WalletService: nowa metoda `transferTip(fromUserId, toUserId, amount)`**
- Walidacja: `amount >= minTipAmount` (z PricingConfig, domyślnie 100 pkt)
- `spendCredits(fromUserId, amount, 'SUPER_LIKE', shortId)` — pobiera z MAIN (nie PROMO!)
- `addCredits(toUserId, 'MAIN', 'EARNED_TIP', amount)` — dodaje do MAIN odbiorcy
- Guardrail: `EARNED_TIP` NIE podlega cash-out (tylko wydanie w systemie)
- Cała operacja w jednej transakcji DB

**2. API: `POST /api/shorts/[id]/super-like`**
- Body: `{ amount: number }` (wielokrotność 100, z PricingConfig)
- Walidacja: user nie może dać sobie tip
- Deleguje do `walletService.transferTip()`

**3. UI: Przycisk Super Like na video player**
- Ikona serca/gwiazdki z opcją kwoty
- Animacja po wysłaniu
- Licznik Super Like'ów na filmie (opcjonalnie)

**4. Testy:**
- Transfer z MAIN (nie PROMO)
- Self-tip → error
- Insufficient credits → error
- Odbiorca dostaje EARNED_TIP w MAIN

**Pliki:**
```
src/lib/wallet/wallet-service.ts             🟡 Nowa metoda transferTip
src/app/api/shorts/[id]/super-like/route.ts  🔴 NOWY
src/components/shorts/super-like-button.tsx   🔴 NOWY
```

---

### VS7: Crons Portfelowe (Inngest)

**Cel:** Automatyczne zarządzanie wygasaniem i maintenance fee.

**Zależności:** VS1

#### Zadania:

**1. `grant-expiration.ts`** (Cron: codziennie 2:00)
- Query: `CreditBatch WHERE wallet = PROMO AND expiresAt < NOW() AND currentBalance > 0`
- Dla każdej partii: zeruj `currentBalance`, wstaw `CreditTransaction` z `PROMO_EXPIRED`
- Emit event `retention/promo-expired` (dla RetentionNotifier)

**2. `maintenance-fee.ts`** (Cron: 1-szego miesiąca 4:00)
- Query: unikalni userId z `CreditBatch WHERE wallet = MAIN AND currentBalance > 0`
- Filtr: `MAX(lastActivityAt) < NOW() - 12 months` dla danego usera
- Pobierz cenę z `PricingConfig` (klucz: `MAINTENANCE_FEE`, domyślnie 500 pkt)
- `walletService.spendCredits(userId, fee, 'MAINTENANCE_FEE')`
- Catch InsufficientCredits: pobierz tyle ile zostało
- Emit event `retention/maintenance-fee-charged`

**3. Rejestracja w Inngest**
- Dodać do `inngest/functions/index.ts`
- Dodać eventy do `inngest/events.ts`

**4. Testy:**
- PROMO expiry: zerowanie po 60d
- PROMO expiry: pominięcie partii z balance = 0
- Maintenance: pobranie 500 pkt po 12mc
- Maintenance: pobranie częściowe (user ma mniej niż 500)
- Maintenance: pominięcie aktywnego usera

**Pliki:**
```
src/lib/inngest/functions/grant-expiration.ts    🔴 NOWY
src/lib/inngest/functions/maintenance-fee.ts     🔴 NOWY
src/lib/inngest/events.ts                        🟡 Nowe eventy
src/lib/inngest/functions/index.ts               🟡 Rejestracja
```

---

### VS8: Retention Notifications

**Cel:** System powiadomień retencyjnych (6 email templates + cron notifier).

**Zależności:** VS7

#### Zadania:

**1. Model `NotificationLog`** (już w VS1 schema)

**2. 6 nowych email templates (React Email / Resend):**

| # | Plik | Trigger | Parametry |
|---|---|---|---|
| 1 | `credit-expiry-30d.tsx` | `EXPIRY_WARN_30D` | `points`, `valuePLN`, `expiresAt` |
| 2 | `credit-expiry-7d.tsx` | `EXPIRY_WARN_7D` | `points`, `expiresAt` |
| 3 | `credit-expiry-1d.tsx` | `EXPIRY_WARN_1D` | `points`, `expiresAt` |
| 4 | `status-loss-warning.tsx` | `STATUS_LOSS_WARN` | `days`, `statusName` (odłożone — brak Premium Status) |
| 5 | `reach-loss-warning.tsx` | `REACH_LOSS_WARN` | `views`, `promoExpiresAt` |
| 6 | `maintenance-fee-notice.tsx` | `MAINTENANCE_FEE_WARN` | `amount`, `remainingBalance` |

> **Uwaga:** Template #4 (`STATUS_LOSS_WARN`) tworzmy jako placeholder — treść gotowa, ale trigger
> nieaktywny (brak Premium Status w MVP). Aktywacja w przyszłym etapie.

**3. `retention-notifier.ts`** (Cron: codziennie 9:00)
- Step "warn-30d": batche MAIN z expiresAt za 29-31 dni
- Step "warn-7d": batche MAIN z expiresAt za 6-8 dni
- Step "warn-1d": batche MAIN z expiresAt za 0-2 dni
- Step "warn-promo-expiry": userzy z PROMO wygasającym za 7 dni BEZ zakupów MAIN
- Step "warn-maintenance-fee": userzy z lastActivityAt < NOW - 11mc (proaktywne)
- Anty-spam: `NotificationLog` z `@@unique([userId, triggerType, batchId])`

**4. Testy:**
- Wysyłka emaila 30d/7d/1d
- Anty-spam: duplikat nie wysyłany
- PROMO expiry warning tylko dla userów bez zakupów
- Maintenance warning proaktywny (11mc)

**Pliki:**
```
src/lib/email/templates/credit-expiry-30d.tsx      🔴 NOWY
src/lib/email/templates/credit-expiry-7d.tsx       🔴 NOWY
src/lib/email/templates/credit-expiry-1d.tsx       🔴 NOWY
src/lib/email/templates/status-loss-warning.tsx    🔴 NOWY (placeholder)
src/lib/email/templates/reach-loss-warning.tsx     🔴 NOWY
src/lib/email/templates/maintenance-fee-notice.tsx 🔴 NOWY
src/lib/inngest/functions/retention-notifier.ts    🔴 NOWY
```

---

### VS9: Admin Wallet UI + Konfigurowalny Cennik

**Cel:** Panel administracyjny do zarządzania portfelami użytkowników i cennikiem usług.

**Zależności:** VS1

#### Zadania:

**1. Strona: `/admin/pricing` — Zarządzanie Cennikiem**
- Tabela z wszystkimi wpisami `PricingConfig`
- Edycja inline: zmiana `cost`, `enabled`
- Grupowanie po `category` (publication, boost, extension, interaction, maintenance)
- Walidacja: `cost >= 0`
- Logowanie zmian w `AuditLog`
- Po zapisie: invalidacja cache w `PricingService`

**2. API: `/api/admin/pricing`**
- `GET` — lista wszystkich cen
- `PUT` — aktualizacja ceny (wymaga ADMIN role)
- Middleware: `requireAdmin()`
- Logowanie: `AuditLog` z `adminId`, `action: 'PRICING_UPDATE'`

**3. Strona: `/admin/users/[id]/wallet` — Portfel Użytkownika**
- Widok: dwa salda (PROMO + MAIN) + lista batchów
- Akcje:
  - "Dodaj bonus" → `walletService.addCredits(userId, wallet, 'BONUS', amount)`
  - "Zamroź partię" → `walletService.freezeBatch(batchId, adminId, reason)`
  - "Odmroź partię" → `walletService.unfreezeBatch(batchId, adminId)`
  - "Refund" → `walletService.refundToExactBatch(userId, batchId, amount)`
- Historia transakcji usera (filtrowana)
- Log operacji admina

**4. API: `/api/admin/wallet/`**
- `POST /grant` — `{ userId, wallet, type, amount, reason }`
- `POST /freeze` — `{ batchId, reason }`
- `POST /unfreeze` — `{ batchId }`
- `POST /refund` — `{ userId, batchId, amount, reason }`
- `GET /[userId]` — pełny widok portfela
- Middleware: `requireAdmin()`
- AuditLog: każda operacja

**5. Rozszerzenie istniejących stron admin**
- `/admin/users` — dodać kolumnę "Saldo" i link do portfela
- `/admin/companies` — dodać link do portfela właściciela

**6. Testy:**
- CRUD PricingConfig (admin only)
- Grant bonus → nowa partia
- Freeze/unfreeze → isFrozen toggle
- Refund → przywrócenie środków
- Non-admin → 403

**Pliki:**
```
src/app/(admin)/[locale]/admin/pricing/page.tsx         🔴 NOWY
src/app/(admin)/[locale]/admin/users/[id]/wallet/       🔴 NOWY
src/app/api/admin/pricing/route.ts                      🔴 NOWY
src/app/api/admin/wallet/grant/route.ts                 🔴 NOWY
src/app/api/admin/wallet/freeze/route.ts                🔴 NOWY
src/app/api/admin/wallet/unfreeze/route.ts              🔴 NOWY
src/app/api/admin/wallet/refund/route.ts                🔴 NOWY
src/app/api/admin/wallet/[userId]/route.ts              🔴 NOWY
src/components/admin/pricing-table.tsx                   🔴 NOWY
src/components/admin/wallet-viewer.tsx                   🔴 NOWY
src/components/admin/wallet-actions.tsx                  🔴 NOWY
```

---

## 4. Kolejność i Zależności

```
VS1 (DB + WalletService)
 ├── VS2 (Payment Flow E2E)
 │    └── [wymaga VS1 — nowe pakiety + WalletService.topUp]
 ├── VS3 (Publikacja + PROMO)
 │    └── [wymaga VS1 — WalletService.spendCredits]
 ├── VS4 (Video Lifecycle)
 │    └── [wymaga VS1 — EXPIRED status, Extension → spendCredits]
 ├── VS5 (Boost Standard)
 │    └── [wymaga VS1 + VS3 — ShortBoost model + spend endpoint]
 ├── VS6 (Super Like)
 │    └── [wymaga VS1 — WalletService.transferTip]
 ├── VS7 (Crons portfelowe)
 │    └── [wymaga VS1 — CreditBatch queries]
 │    └── VS8 (Retention Notifications)
 │         └── [wymaga VS7 — eventy z cronów]
 └── VS9 (Admin UI + Cennik)
      └── [wymaga VS1 — PricingConfig model + WalletService]
```

**Ścieżka krytyczna:** VS1 → VS2 → VS3
**Równoległe po VS1:** VS4, VS5, VS6, VS7, VS9
**Sekwencyjne:** VS7 → VS8

---

## 5. Podsumowanie Plików (Impact Map)

### Nowe pliki (25+)
```
src/lib/wallet/wallet-types.ts
src/lib/wallet/wallet-constants.ts
src/lib/wallet/wallet-service.ts
src/lib/wallet/pricing-service.ts
src/lib/wallet/__tests__/wallet-service.test.ts
src/lib/wallet/__tests__/pricing-service.test.ts
src/lib/inngest/functions/expire-shorts.ts
src/lib/inngest/functions/deep-archive.ts
src/lib/inngest/functions/grant-expiration.ts
src/lib/inngest/functions/maintenance-fee.ts
src/lib/inngest/functions/retention-notifier.ts
src/lib/email/templates/credit-expiry-30d.tsx
src/lib/email/templates/credit-expiry-7d.tsx
src/lib/email/templates/credit-expiry-1d.tsx
src/lib/email/templates/status-loss-warning.tsx
src/lib/email/templates/reach-loss-warning.tsx
src/lib/email/templates/maintenance-fee-notice.tsx
src/app/api/wallet/spend/route.ts
src/app/api/wallet/top-up/route.ts
src/app/api/shorts/[id]/extend/route.ts
src/app/api/shorts/[id]/boost/route.ts
src/app/api/shorts/[id]/super-like/route.ts
src/app/api/admin/pricing/route.ts
src/app/api/admin/wallet/*/route.ts (5 plików)
src/app/(admin)/[locale]/admin/pricing/page.tsx
src/app/(admin)/[locale]/admin/users/[id]/wallet/page.tsx
src/components/shorts/extension-modal.tsx
src/components/shorts/boost-modal.tsx
src/components/shorts/super-like-button.tsx
src/components/admin/pricing-table.tsx
src/components/admin/wallet-viewer.tsx
src/components/admin/wallet-actions.tsx
prisma/seed.ts
```

### Zmodyfikowane pliki (15+)
```
prisma/schema.prisma
src/lib/payments/index.ts
src/lib/publication/publication-controller.ts
src/lib/inngest/events.ts
src/lib/inngest/functions/index.ts
src/lib/inngest/functions/archive-expired.ts
src/lib/utils/feed-scoring.ts
src/app/api/payments/checkout/route.ts
src/app/api/webhooks/przelewy24/route.ts
src/app/api/webhooks/tpay/route.ts
src/app/api/webhooks/qencode/route.ts
src/app/api/credits/route.ts
src/app/(main)/[locale]/panel/credits/page.tsx
src/app/(main)/[locale]/panel/shorts/page.tsx
src/components/payments/* (refaktor)
src/components/shorts/publish-dialog.tsx
```

### Usunięte elementy
```
User.publicationCredits (pole)
Payment.shortId (pole + relacja)
CreditSource (cały enum)
CREDIT_PACKAGES, PRICE_PER_CREDIT (stałe)
```

---

## 6. Przelicznik Retencyjny

Używany w powiadomieniach ("Twoje punkty warte X PLN"):

```typescript
// Oparty o najtańszy pakiet: 10 000 pkt = 15 PLN
export const POINTS_TO_PLN_RATE = 0.0015; // 1 pkt ≈ 0.0015 PLN

export function pointsToApproxPLN(points: number): string {
  return (points * POINTS_TO_PLN_RATE).toFixed(2);
}

// Przykłady:
// 100 pkt ≈ 0.15 PLN
// 500 pkt ≈ 0.75 PLN
// 1 000 pkt ≈ 1.50 PLN
// 10 000 pkt ≈ 15.00 PLN
// 50 000 pkt ≈ 75.00 PLN
```

---

## 7. Definicja "Done" per Vertical Slice

Każdy VS jest uznany za zakończony gdy:
1. Testy TDD napisane i przechodzą (green)
2. Kod produkcyjny zaimplementowany
3. `npm run build` przechodzi bez błędów
4. Testy regresji (istniejące) nadal przechodzą
5. Migracja Prisma wygenerowana i zastosowana
6. Commit z opisem zmian
