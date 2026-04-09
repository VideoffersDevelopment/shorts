# Checklist testowania frontendu - Credit Ledger System

**Data utworzenia:** 2026-03-19
**Status implementacji:** ~95% gotowe (VS1-VS9 + wszystkie komponenty UI)

---

## A. Nawigacja i dostępność stron

### Sidebar główny (rola COMPANY)
- [ ] W sidebarze widoczny link **"Kredyty"** z ikoną Coins
- [ ] Link prowadzi do `/{locale}/panel/credits`
- [ ] Widoczne też: "Moje filmiki", "Profil firmy"
- [ ] Sidebar zwijany/rozwijany działa poprawnie

### Admin sidebar
- [ ] Link **"Pricing"** (Cennik) widoczny z ikoną DollarSign
- [ ] Link prowadzi do `/{locale}/admin/pricing`
- [ ] Etykieta przetłumaczona (nie hardcoded "Pricing")
- [ ] Kolejność: Dashboard → Companies → Categories → Users → **Pricing** → Audit

---

## B. Rejestracja firmy - PROMO banner (VS3 UI)

**Route:** `/{locale}/settings/upgrade`

- [ ] Wypełnić formularz rejestracji firmy (nazwa, NIP, adres)
- [ ] Po pomyślnej rejestracji widać ekran sukcesu
- [ ] Na ekranie sukcesu widać **fioletowy banner PROMO**:
  - [ ] Ikona Gift (prezent) po lewej
  - [ ] Tekst główny: "1,000 PROMO credits added!" (EN) / "Dodano 1 000 kredytów PROMO!" (PL)
  - [ ] Podtekst o 60 dniach na wykorzystanie
  - [ ] Border i tło fioletowe (purple-200/purple-50 w light mode)
- [ ] Status badge VIES (verified/pending) widoczny nad bannerem
- [ ] Przycisk "Przejdź do profilu firmy" działa i przekierowuje do `/{locale}/panel/company/overview`

---

## C. Strona Kredytów (panel użytkownika)

**Route:** `/{locale}/panel/credits` (wymaga roli COMPANY)

### Wyświetlacz salda portfela
- [ ] Strona się ładuje bez błędów
- [ ] **Łączne saldo (total)** widoczne na górze
- [ ] **Karta PROMO** (fioletowa):
  - [ ] Saldo PROMO wyświetlone z separatorami tysięcy
  - [ ] Data wygaśnięcia w formacie czytelnym
  - [ ] Countdown dni pozostałych do wygaśnięcia
  - [ ] Ostrzeżenie jeśli < 7 dni (pomarańczowe) lub wygasło (czerwone)
- [ ] **Karta MAIN** (niebieska):
  - [ ] Saldo MAIN wyświetlone
  - [ ] Data wygaśnięcia
  - [ ] Status maintenance fee (aktywny/nieaktywny)
- [ ] **Przelicznik PLN** (~X PLN) widoczny pod każdą kartą

### Pakiety kredytów
- [ ] 4 pakiety w siatce 2×2 (mobile) lub 4×1 (desktop):
  - [ ] 500 pts
  - [ ] 1,000 pts
  - [ ] 2,500 pts
  - [ ] 5,000 pts
- [ ] Każdy pakiet pokazuje:
  - [ ] Label (np. "500 punktów")
  - [ ] Opis (np. "Starter pack")
  - [ ] Cenę w PLN (np. "19.99 PLN")
  - [ ] Przycisk "Kup"
- [ ] Przycisk "Kup" prowadzi do `/{locale}/panel/credits/buy?package={id}`

### Historia transakcji
- [ ] Tabela z kolumnami: **Data**, **Typ**, **Kwota**, **Saldo**, **Powiązany Short**
- [ ] **Kolorowanie kwot:**
  - [ ] Zielone dla wpływów (+)
  - [ ] Czerwone dla wydatków (-)
- [ ] **Ikony typów akcji:**
  - [ ] PUBLICATION (publikacja shorta)
  - [ ] EXTENSION (przedłużenie)
  - [ ] BOOST_STD (boost standardowy)
  - [ ] SUPER_LIKE (super like)
  - [ ] REFUND (zwrot)
  - [ ] ADMIN_GRANT (przyznanie przez admina)
  - [ ] MAINTENANCE_FEE (opłata utrzymaniowa)
  - [ ] PROMO_EXPIRED (wygaśnięcie PROMO)
- [ ] Kolumna "Powiązany Short" pokazuje link do shorta (jeśli dotyczy)

### Modal zakupu kredytów
- [ ] Przycisk **"Kup kredyty"** otwiera modal
- [ ] **Wybór pakietu:**
  - [ ] Radio buttony w 2-kolumnowej siatce
  - [ ] Aktywny pakiet podświetlony
- [ ] **Wybór operatora płatności:**
  - [ ] Przelewy24
  - [ ] TPay
  - [ ] Radio buttony
- [ ] **Podsumowanie:**
  - [ ] Wyświetla wybraną kwotę
  - [ ] Wyświetla wybranego operatora
- [ ] Przycisk **"Przejdź do płatności"** aktywny po wyborze obu opcji
- [ ] Kliknięcie wywołuje `POST /api/payments/checkout`

### Warunki dostępu
- [ ] Jeśli użytkownik nie jest COMPANY → redirect do `/{locale}/panel`
- [ ] Jeśli niezalogowany → redirect do `/{locale}/login`

---

## D. Zarządzanie Shortami (Boost + Extension)

**Route:** `/{locale}/panel/shorts` (wymaga roli COMPANY)

### Widok ogólny
- [ ] Lista shortów widoczna w tabeli
- [ ] Kolumny: Miniatura, Tytuł, Status, Statystyki, Akcje
- [ ] Aktualne saldo kredytów przekazane do komponentu

### Boost Modal
- [ ] **Przycisk "Boost"** w akcjach shorta (menu trzech kropek)
- [ ] Otwiera modal `BoostModal`
- [ ] **Wyświetlane informacje:**
  - [ ] Koszt boost (domyślnie 80 pts, z pricing config)
  - [ ] Czas trwania boost (7 dni)
  - [ ] Aktualne saldo użytkownika
- [ ] **Kolorowanie salda:**
  - [ ] Zielone jeśli stać (saldo >= koszt)
  - [ ] Czerwone jeśli nie stać (saldo < koszt)
- [ ] Przycisk **"Boost Short"** aktywny tylko jeśli stać
- [ ] **Kliknięcie wywołuje:** `POST /api/shorts/{id}/boost`
- [ ] **Przy braku kredytów:**
  - [ ] Odpowiedź 402 Payment Required
  - [ ] Toast z komunikatem o niedostatecznych środkach
  - [ ] Link do zakupu kredytów w toaście
- [ ] **Przy sukcesie:**
  - [ ] Toast sukcesu
  - [ ] Odświeżenie listy shortów (router.refresh)
  - [ ] Zamknięcie modalu

### Extension Modal
- [ ] **Przycisk "Przedłuż"** w akcjach shorta
- [ ] Otwiera modal `ExtensionModal`
- [ ] **4 opcje przedłużenia (radio buttony):**
  - [ ] +30 dni (500 pts)
  - [ ] +3 miesiące (1,350 pts)
  - [ ] +6 miesięcy (2,500 pts)
  - [ ] +12 miesięcy (4,500 pts)
- [ ] **Wyświetlane informacje:**
  - [ ] Aktualna data wygaśnięcia shorta
  - [ ] Nowa data wygaśnięcia (preview po wyborze opcji)
  - [ ] Aktualne saldo użytkownika
- [ ] Sprawdzenie salda przed aktywacją przycisku
- [ ] **Kliknięcie wywołuje:** `POST /api/shorts/{id}/extend`
- [ ] **Obsługa błędów i sukcesu** analogiczna do Boost

### Publikacja shorta (PublishDialog)
- [ ] **Przycisk "Publikuj"** w akcjach shorta (status DRAFT)
- [ ] Otwiera dialog publikacji
- [ ] **Wyświetla aktualne saldo**
- [ ] **Dwie opcje:**
  - [ ] "Użyj kredytów" (jeśli saldo wystarczające)
  - [ ] "Kup kredyty" (jeśli brak kredytów lub jako alternatywa)
- [ ] **Brak kredytów:**
  - [ ] Alert z informacją o braku środków
  - [ ] Link do `/{locale}/panel/credits`
- [ ] **Publikacja kosztuje kredyty** (koszt z pricing config)
- [ ] Wywołuje `POST /api/shorts/{id}/publish`

---

## E. Super Like (widok publiczny shorta)

**Route:** `/{locale}/shorts/{id}` lub w feedzie

### Ogólne
- [ ] Przycisk serduszka (Super Like) widoczny na opublikowanym shorcie
- [ ] Widoczny zarówno na **mobile** jak i **desktop**
- [ ] Nie wyświetlany na archiwalnych shortach

### Zachowanie dla różnych użytkowników
- [ ] **Niezalogowany:**
  - [ ] Kliknięcie przekierowuje do `/{locale}/login`
- [ ] **Własny short:**
  - [ ] Przycisk nieaktywny (disabled) lub ukryty
- [ ] **Zalogowany, cudzy short:**
  - [ ] Kliknięcie wywołuje `POST /api/shorts/{id}/super-like`
  - [ ] **Sukces:**
    - [ ] Animacja (serduszko wypełnia się)
    - [ ] Serduszko zmienia kolor na różowy (pink)
    - [ ] Tło przycisku różowe
    - [ ] Toast sukcesu
  - [ ] **Brak kredytów:**
    - [ ] Odpowiedź 402 Payment Required
    - [ ] Toast z komunikatem o niedostatecznych środkach

### Integracja
- [ ] Komponent `SuperLikeButton` używany w `PublicShortView`
- [ ] Przekazywane propsy: `shortId`, `userId`, `companyId`, `isOwn`

---

## F. Admin: Tabela użytkowników z kolumną Balance

**Route:** `/{locale}/admin/users`

### Kolumna Balance
- [ ] Kolumna **"Balance"** / **"Saldo"** widoczna w tabeli
- [ ] Pozycja: między kolumną "Registered" / "Data rejestracji" a kolumną "Actions"
- [ ] **Wyświetla sumę `currentBalance`** ze wszystkich credit batches użytkownika
- [ ] Format: **"X pts"** (np. "1,250 pts")
- [ ] Font: `font-mono` dla czytelności liczb
- [ ] Liczba z separatorami tysięcy (np. 1,250 zamiast 1250)

### Akcja Wallet
- [ ] W menu trzech kropek (Actions) widoczna akcja **"Wallet"** / **"Portfel"**
- [ ] Ikona: `Wallet` (lucide-react)
- [ ] Pozycja: po akcji "Change Role", przed "Block/Unblock"
- [ ] **Kliknięcie przenosi do:** `/{locale}/admin/users/{id}/wallet`
- [ ] Akcja widoczna dla wszystkich użytkowników (również dla siebie)

### Sortowanie i filtrowanie
- [ ] Kolumna Balance NIE jest sortowalna (brak DataTableColumnHeader z sortowaniem)
- [ ] Filtrowanie po roli i statusie działa normalnie

---

## G. Admin: Tabela firm z linkiem do portfela

**Route:** `/{locale}/admin/companies`

### Akcja Owner Wallet
- [ ] W menu trzech kropek widoczna akcja **"Owner Wallet"** / **"Portfel właściciela"**
- [ ] Ikona: `Wallet` (lucide-react)
- [ ] Pozycja: po akcji "Reject", przed "Delete"
- [ ] **Kliknięcie przenosi do:** `/{locale}/admin/users/{userId}/wallet`
  - [ ] **UWAGA:** Nawiguje do portfela **właściciela firmy** (userId), NIE do ID firmy
- [ ] Etykieta przetłumaczona:
  - [ ] EN: "Owner Wallet"
  - [ ] PL: "Portfel właściciela"

### Weryfikacja mapowania danych
- [ ] CompanyRow zawiera pole `userId` (zmapowane z `user.id`)
- [ ] `onWallet` handler przekazuje `company.userId`, nie `company.id`

---

## H. Admin: Strona portfela użytkownika

**Route:** `/{locale}/admin/users/{id}/wallet`

### Karty salda
- [ ] **3 karty:** Total, PROMO, MAIN
- [ ] **Total (szara):**
  - [ ] Łączne saldo ze wszystkich walletów
- [ ] **PROMO (fioletowa):**
  - [ ] Saldo PROMO
  - [ ] Najbliższa data wygaśnięcia PROMO batch
- [ ] **MAIN (niebieska):**
  - [ ] Saldo MAIN
  - [ ] Najbliższa data wygaśnięcia MAIN batch

### Tabela Credit Batches
- [ ] Kolumny: **Wallet**, **Type**, **Balance**, **Initial**, **Expires**, **Status**
- [ ] **Badge statusów:**
  - [ ] **Frozen** (zamrożony) - czerwony/destructive
  - [ ] **Active** (aktywny) - zielony/default
  - [ ] **Depleted** (wyczerpany) - szary/secondary
- [ ] Sortowanie po `createdAt` desc (najnowsze na górze)
- [ ] Klikalna kolumna "Batch ID" (możliwość kopiowania)

### Tabela Recent Transactions
- [ ] Ostatnie 20 transakcji
- [ ] Kolumny: **Date**, **Type**, **Amount**, **Balance After**, **Related Short**
- [ ] **Kolorowanie kwot:**
  - [ ] Zielone dla dodatnich (wpływy)
  - [ ] Czerwone dla ujemnych (wydatki)
- [ ] Typ akcji z ikoną (PUBLICATION, BOOST, etc.)

### Przyciski akcji (WalletActions)
- [ ] **4 przyciski widoczne:**
  - [ ] Grant (Plus icon)
  - [ ] Freeze (Snowflake icon)
  - [ ] Unfreeze (Snowflake icon)
  - [ ] Refund (RotateCcw icon)

#### Grant Dialog
- [ ] Otwiera modal "Grant Credits"
- [ ] **Pola:**
  - [ ] Wallet (Select: MAIN / PROMO)
  - [ ] Amount (number input, min 1)
  - [ ] Reason (textarea, wymagane)
- [ ] Przycisk "Grant Credits" aktywny po wypełnieniu wszystkich pól
- [ ] **Wywołuje:** `POST /api/admin/wallet/grant`
- [ ] **Toast sukcesu:** "Granted X pts to WALLET"
- [ ] Po sukcesie: odświeżenie strony (router.refresh)

#### Freeze Dialog
- [ ] Otwiera modal "Freeze Batch"
- [ ] **Pola:**
  - [ ] Batch ID (text input, placeholder sugeruje skopiowanie z tabeli)
  - [ ] Reason (textarea, wymagane)
- [ ] Przycisk "Freeze Batch" (czerwony/destructive)
- [ ] **Wywołuje:** `POST /api/admin/wallet/freeze`
- [ ] **Toast sukcesu:** "Batch frozen"

#### Unfreeze Dialog
- [ ] Otwiera modal "Unfreeze Batch"
- [ ] **Pole:**
  - [ ] Batch ID (text input)
- [ ] Przycisk "Unfreeze Batch"
- [ ] **Wywołuje:** `POST /api/admin/wallet/unfreeze`
- [ ] **Toast sukcesu:** "Batch unfrozen"

#### Refund Dialog
- [ ] Otwiera modal "Refund to Batch"
- [ ] **Pola:**
  - [ ] Batch ID (text input)
  - [ ] Amount (number input, min 1)
  - [ ] Reason (textarea, wymagane)
- [ ] Przycisk "Refund Credits"
- [ ] **Wywołuje:** `POST /api/admin/wallet/refund`
- [ ] **Toast sukcesu:** "Refunded X pts"

### Walidacja i błędy
- [ ] Wszystkie dialogi walidują pola przed wysłaniem
- [ ] Alert z błędem (czerwony) jeśli API zwróci błąd
- [ ] Loading state (Loader2 spinner) podczas wysyłania
- [ ] Przyciski disabled podczas ładowania

---

## I. Admin: Konfiguracja cennika

**Route:** `/{locale}/admin/pricing`

### Nagłówek
- [ ] Tytuł: "Pricing Configuration"
- [ ] Ikona: `DollarSign` (lucide-react)
- [ ] Opis: "Manage service costs and availability..."

### Grupy cennikowe (Cards)
- [ ] **6 grup widocznych jako osobne karty:**
  - [ ] Publication (publikacja)
  - [ ] Boost (wzmocnienie)
  - [ ] Extension (przedłużenie)
  - [ ] Interaction (super like)
  - [ ] Maintenance (opłaty utrzymaniowe)
  - [ ] Utility (narzędzia)
- [ ] Każda grupa ma tytuł w CardHeader

### Tabela w każdej grupie
- [ ] Kolumny: **Key**, **Label**, **Cost (pts)**, **Status**, **Description**, **Actions**
- [ ] **Kolumna Key:** font mono, mała czcionka (text-xs)
- [ ] **Kolumna Label:** normalna czcionka, nazwa usługi
- [ ] **Kolumna Cost:** pogrubiona liczba z separatorami tysięcy
- [ ] **Kolumna Status:**
  - [ ] Badge "Active" (zielony) jeśli enabled
  - [ ] Badge "Disabled" (szary) jeśli !enabled
- [ ] **Kolumna Description:**
  - [ ] Text muted-foreground
  - [ ] Truncate jeśli za długi (max-w-[200px])
- [ ] **Kolumna Actions:** przyciski Edit/Save/Cancel

### Edycja inline
- [ ] **Kliknięcie "Edit":**
  - [ ] Wiersz przełącza się w tryb edycji
  - [ ] Pole `cost` staje się numerycznym inputem (width: w-28)
  - [ ] Badge `enabled/disabled` zmienia się w Switch component
  - [ ] Przycisk Edit → Save (zielona ikona) + Cancel (X)
  - [ ] Tylko jeden wiersz może być w trybie edycji naraz (disabled other Edit buttons)
- [ ] **Kliknięcie "Save":**
  - [ ] Wywołuje `PUT /api/admin/pricing` z body: `{ key, cost, enabled }`
  - [ ] Loading state (spinner w przycisku)
  - [ ] Toast sukcesu: "{key} updated"
  - [ ] Router.refresh() po sukcesie
  - [ ] Powrót do trybu widoku
- [ ] **Kliknięcie "Cancel":**
  - [ ] Odrzuca zmiany
  - [ ] Powrót do trybu widoku bez zapisu

### Warunki początkowe
- [ ] Jeśli brak konfiguracji w bazie (pusty pricing):
  - [ ] Wyświetla pusty Card z komunikatem: "No pricing configuration found. Run the seed to populate defaults."
- [ ] Jeśli są dane: renderuje wszystkie grupy z tabelami

---

## J. Tłumaczenia (i18n)

### Namespace: `admin`
- [ ] **EN (admin.json):**
  - [ ] `nav.pricing` → "Pricing" ✅
  - [ ] `users.table.balance` → "Balance" ✅
  - [ ] `users.actions.wallet` → "Wallet" ✅
  - [ ] `companies.actions.wallet` → "Owner Wallet" ✅
- [ ] **PL (admin.json):**
  - [ ] `nav.pricing` → "Cennik" ✅
  - [ ] `users.table.balance` → "Saldo" ✅
  - [ ] `users.actions.wallet` → "Portfel" ✅
  - [ ] `companies.actions.wallet` → "Portfel właściciela" ✅

### Namespace: `companies`
- [ ] **EN (companies.json):**
  - [ ] `upgrade.success.promoTitle` → "1,000 PROMO credits added!" ✅
  - [ ] `upgrade.success.promoDescription` → "Use them within 60 days..." ✅
- [ ] **PL (companies.json):**
  - [ ] `upgrade.success.promoTitle` → "Dodano 1 000 kredytów PROMO!" ✅
  - [ ] `upgrade.success.promoDescription` → "Wykorzystaj je w ciągu 60 dni..." ✅

### Namespace: `payments` (już istniejący)
- [ ] `page.title`, `page.description`
- [ ] `packages.title`, `packages.buy`
- [ ] `info.*`, `history.*`
- [ ] Wszystkie klucze działają zarówno w EN jak i PL

### Test przełączania języka
- [ ] Przełącz na **PL** → wszystkie nowe etykiety w języku polskim
- [ ] Przełącz na **EN** → wszystkie etykiety w języku angielskim
- [ ] Brak komunikatów "missing translation"

---

## K. Znane ograniczenia / TODO

### Niezaimplementowane funkcjonalności
- [ ] **Company overview** (`/{locale}/panel/company/overview`):
  - Używa mockowych statystyk `walletBalance: 0`
  - TODO: podłączenie realnego salda z `getWalletBalance()`
  - Potrzebna aktualizacja komponentu `CompanyOwnerProfile` lub strony overview

- [ ] **Płatności (Przelewy24/TPay)**:
  - Endpoint `/api/payments/checkout` istnieje
  - Wymaga konfiguracji bramek płatniczych w `.env`
  - Należy dodać klucze API: `PRZELEWY24_*`, `TPAY_*`
  - Callback URL dla statusu płatności wymaga testów

### Pre-istniejące błędy (poza zakresem)
- [ ] `retention-notifier.ts:332` - Type 'null' is not assignable to type 'string' (niezwiązany z credit system)

### Funkcjonalności zaimplementowane ale wymagające testów manualnych
- [ ] Cron job: PROMO expiration (expire-promo-credits.ts)
- [ ] Cron job: Maintenance fee (maintenance-fee.ts)
- [ ] Cron job: Boost expiry (expire-boosts.ts)
- [ ] Retention notifier (retention-notifier.ts)

---

## L. Pliki zmodyfikowane w tej sesji

### VS3 UI - PROMO banner
1. `src/components/companies/company-upgrade-form.tsx` - dodany fioletowy banner PROMO
2. `src/lib/locales/en/companies.json` - klucze `upgrade.success.promoTitle|promoDescription`
3. `src/lib/locales/pl/companies.json` - j.w.

### Admin Users - Balance column + wallet link
4. `src/components/admin/columns/users-columns.tsx` - kolumna walletBalance + akcja Wallet
5. `src/components/admin/users-data-table.tsx` - handler `handleWallet`
6. `src/app/(admin)/[locale]/admin/users/page.tsx` - agregacja salda z creditBatches

### Admin Companies - owner wallet link
7. `src/components/admin/columns/companies-columns.tsx` - userId + akcja Wallet
8. `src/components/admin/companies-data-table.tsx` - handler `handleWallet`
9. `src/app/(admin)/[locale]/admin/companies/page.tsx` - mapowanie userId

### i18n + sidebar fix
10. `src/lib/locales/en/admin.json` - klucze balance, wallet, pricing
11. `src/lib/locales/pl/admin.json` - j.w.
12. `src/components/admin/admin-sidebar.tsx` - fix hardcoded "Pricing" → `t("nav.pricing")`

---

## M. Podsumowanie implementacji

### Backend (VS1-VS9) - 100% ✅
- Dual wallet (PROMO + MAIN) - ✅
- Credit batches (FIFO spending) - ✅
- Transactions log - ✅
- PROMO grant przy rejestracji (1000 pts, 60 dni) - ✅
- Pricing configuration (database-driven) - ✅
- API endpoints (boost, extend, super-like, publish) - ✅
- Admin wallet management (grant, freeze, unfreeze, refund) - ✅
- Cron jobs (expiry, maintenance fee) - ✅

### Frontend UI - 95% ✅
- Wallet balance display (PROMO + MAIN cards) - ✅
- Credits page (balance + packages + history) - ✅
- Purchase modal - ✅
- Boost modal - ✅
- Extension modal - ✅
- Super Like button - ✅
- Publish dialog (credits integration) - ✅
- Admin pricing management - ✅
- Admin wallet viewer + actions - ✅
- Admin users: Balance column + wallet link - ✅
- Admin companies: owner wallet link - ✅
- PROMO welcome banner - ✅
- i18n (EN + PL) - ✅

### TODO (5%)
- Company overview: real wallet balance (mock currently)
- Payment gateway integration (Przelewy24/TPay config)

---

## N. Instrukcje testowania

### Przygotowanie środowiska testowego
1. Uruchom dev server: `npm run dev`
2. Zaloguj się jako użytkownik z rolą COMPANY
3. Jeśli nie masz firmy: przejdź przez rejestrację (`/{locale}/settings/upgrade`)
4. Sprawdź że masz kredyty PROMO (1000 pts z rejestracji)

### Sekwencja testowania (rekomendowana)
1. **Rejestracja firmy** → sprawdź banner PROMO (sekcja B)
2. **Nawigacja** → sprawdź linki w sidebarach (sekcja A)
3. **Strona kredytów** → sprawdź wyświetlacze, pakiety, historię (sekcja C)
4. **Shorty** → sprawdź boost, extension, publikację (sekcja D)
5. **Super Like** → sprawdź w feedzie/widoku shorta (sekcja E)
6. **Admin panel** → przełącz się na rolę ADMIN:
   - Users table → kolumna Balance, akcja Wallet (sekcja F)
   - Companies table → akcja Owner Wallet (sekcja G)
   - User wallet page → batch tables, akcje (sekcja H)
   - Pricing config → edycja inline (sekcja I)
7. **i18n** → przełącz język PL ↔ EN, sprawdź tłumaczenia (sekcja J)

### Przykładowe scenariusze testowe

#### Scenariusz 1: Nowy użytkownik firmowy
1. Zarejestruj nową firmę
2. Sprawdź banner PROMO (1000 pts)
3. Przejdź do `/panel/credits`
4. Sprawdź że PROMO wallet ma 1000 pts
5. Opublikuj shorta (koszt z pricing config, np. 0 pts lub 100 pts)
6. Użyj boost na shorcie (80 pts)
7. Sprawdź że PROMO wallet się zmniejszył
8. Sprawdź historię transakcji

#### Scenariusz 2: Admin zarządza portfelem
1. Zaloguj jako ADMIN
2. Przejdź do `/admin/users`
3. Znajdź użytkownika, kliknij "Wallet"
4. Sprawdź batch tables i transakcje
5. Użyj akcji "Grant" → dodaj 500 pts do MAIN
6. Sprawdź że saldo się zaktualizowało
7. Użyj akcji "Freeze" → zamroź batch
8. Sprawdź że status zmienił się na "Frozen"
9. Użyj "Unfreeze" → odmroź

#### Scenariusz 3: Konfiguracja cennika
1. Zaloguj jako ADMIN
2. Przejdź do `/admin/pricing`
3. Znajdź "boost_standard" w kategorii Boost
4. Kliknij "Edit"
5. Zmień koszt z 80 na 100
6. Zapisz
7. Sprawdź że toast sukcesu się pojawił
8. Wróć do panelu firmy
9. Spróbuj użyć boost → sprawdź czy nowy koszt (100) jest wyświetlony

---

**Koniec checklisty**
