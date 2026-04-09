# PRD i Specyfikacja Techniczna

## Aplikacja Video Shorts dla Promocji Produktów

**Wersja:** 2.0 (SaaS Stack)  
**Data:** 28.11.2025  
**Stack:** Next.js | Neon DB | Vercel | Mux | Resend | PostHog

---

## 1. Streszczenie

Aplikacja to nowoczesna platforma do przeglądania krótkich filmów promocyjnych produktów w formacie vertical video (shorts). Głównym celem jest umożliwienie firmom prezentacji swoich produktów poprzez krótkie, angażujące filmy, z bezpośrednim przekierowaniem do sklepu internetowego.

### 1.1 Kluczowe Założenia

Platforma webowa z planem rozszerzenia na aplikacje mobilne. Model biznesowy oparty na pay-per-video dla publikujących firmy. Technologia oparta na nowoczesnym stosie SaaS: Next.js, Neon DB (serverless PostgreSQL), Vercel dla hostingu, Mux dla przetwarzania wideo, Resend dla emaili transakcyjnych, Perspective API dla moderacji AI, Cloudflare R2 dla storage, Inngest dla kolejkowania zadań oraz PostHog dla analityki. Geolokalizacja stanowi kluczowy filtr treści umożliwiający użytkownikom odkrywanie lokalnych produktów.

### 1.2 Dlaczego SaaS Stack?

Architektura oparta na zarządzanych usługach SaaS eliminuje potrzebę zarządzania infrastrukturą serwerową. Vercel zapewnia zero-config deployment z automatycznym skalowaniem. Neon DB oferuje serverless PostgreSQL z automatycznym branching dla development. Mux eliminuje złożoność przetwarzania wideo - transkodowanie, generowanie thumbnailów i adaptive streaming działa out-of-box. Resend upraszcza wysyłkę emaili transakcyjnych z gotowymi szablonami React Email. PostHog dostarcza gotowe dashboardy analityczne bez potrzeby budowania własnych. Inngest zastępuje tradycyjne kolejki (Bull/Redis) event-driven architecture bez zarządzania infrastrukturą. Perspective API automatycznie moderuje treści tekstowe przy pomocy AI.

---

## 2. Model Biznesowy

### 2.1 Monetyzacja

System pay-per-video oznacza, że firmy płacą za każdy opublikowany shorts. Płatności obsługiwane są przez Stripe z automatycznym wystawianiem faktur. Stripe Invoicing generuje profesjonalne faktury PDF i wysyła je automatycznie emailem przez Resend.

### 2.2 Typy Użytkowników

**Zwykły Użytkownik** to osoba przeglądająca shortsy bez konieczności logowania. Ma możliwość komentowania i reagowania po zalogowaniu. Rejestracja odbywa się przez email i hasło lub przez social media (Google, Facebook).

**Firma/Sprzedawca** posiada to samo konto co zwykły użytkownik, z opcją dodania danych firmowych. Ma możliwość publikacji shortsów w modelu pay-per-video. Posiada własny profil firmowy podobny do kanału YouTube z dostępem do statystyk i dashboardu firmy zasilanego przez PostHog.

**Administrator** ma pełny dostęp do dashboardu administracyjnego. Odpowiada za moderację treści wspomaganą przez Perspective API, moderację komentarzy i użytkowników oraz zarządzanie parametrami systemu.

---

## 3. Wymagania Funkcjonalne

### 3.1 Shorts (Rolki Wideo)

#### 3.1.1 Parametry Techniczne

Maksymalny czas trwania shortsa to 60 sekund, wartość ta jest edytowalna przez admina w panelu konfiguracji. Akceptowane formaty to MP4, MOV oraz inne popularne formaty wideo obsługiwane przez Mux. Maksymalny rozmiar pliku wynosi 100 MB dzięki direct upload do Mux, który obsługuje duże pliki bez obciążania serwera aplikacji. Orientacja wideo to vertical video w formacie 9:16 zgodnym z TikTok i Instagram Reels. Transkodowanie realizowane jest automatycznie przez Mux do różnych jakości: 1080p, 720p, 480p z adaptive bitrate streaming (HLS).

#### 3.1.2 Metadane Shortsa

Każdy shorts posiada tytuł jako pole wymagane o maksymalnej długości 100 znaków oraz opcjonalny opis do 500 znaków. Kategorie wybierane są z predefiniowanej listy zarządzanej przez admina. Tagi są opcjonalne, maksymalnie 10 tagów na shortsa. Link do produktu jest wymagany i stanowi główny element konwersji. Cena produktu jest opcjonalna i wyświetlana na życzenie właściciela. Lokalizacja obejmuje miasto i kraj dla funkcji geolokalizacji.

#### 3.1.3 Zarządzanie Shortsem

System obsługuje workflow Draft/Publikacja z możliwością zapisania jako szkic przed opłaceniem. Po publikacji możliwa jest edycja metadanych bez zmiany samego wideo. Właściciel może wycofać shortsa z publikacji (ukrycie) lub całkowicie go usunąć. Usunięcie powoduje również usunięcie pliku wideo z Mux i Cloudflare R2.

### 3.2 System Filtrowania

#### 3.2.1 Geolokalizacja

System pyta o lokalizację przy pierwszym wejściu na stronę z przyjaznym UX wyjaśniającym korzyści. Przypomnienie o wyrażeniu zgody wyświetla się co 30 dni dla użytkowników, którzy odmówili. Użytkownik ma możliwość zmiany lokalizacji w dowolnym momencie przez UI. Filtrowanie odbywa się po mieście i kraju z priorytetem lokalnych produktów w feedzie. Shortsy nie są przypisane do konkretnego sklepu fizycznego, tylko do lokalizacji firmy.

#### 3.2.2 Inne Filtry

Dostępne są filtry po kategoriach produktów oraz tagach z możliwością multi-select. Sortowanie obejmuje opcje: najnowsze, najpopularniejsze (bazujące na views) oraz trending (algorytm uwzględniający engagement w czasie). Wyszukiwanie pełnotekstowe obejmuje tytuły, opisy i nazwy firm.

### 3.3 Profile Firm

Każda firma posiada własny profil podobny do kanału YouTube. Profil zawiera logo firmy i opcjonalne zdjęcie w tle przechowywane w Cloudflare R2. Wyświetlana jest nazwa firmy i krótki opis oraz opcjonalne informacje kontaktowe (email, telefon, adres). Na profilu widoczne są wszystkie opublikowane shortsy firmy w formie gridu. Statystyki obejmują liczbę shortsów, łączną liczbę wyświetleń i followersów. Użytkownicy mają możliwość subskrypcji/followowania profilu firmy z powiadomieniami o nowych shortsach. Profil zawiera również link do strony www firmy otwierany w nowej karcie.

### 3.4 System Interakcji

#### 3.4.1 Reakcje

Like jest widoczny publicznie z licznikiem na shortsie. Dislike jest widoczny tylko dla właściciela shortsa w dashboardzie, co pozwala firmom zrozumieć co nie działa bez negatywnego wpływu na publiczny odbiór. Emoji reactions obejmują zestaw reakcji (😍, 🔥, 👏, 😮, 🤔) z licznikami dla każdej. Wszystkie reakcje wymagają zalogowania.

#### 3.4.2 Komentarze

Struktura komentarzy jest płaska, bez zagnieżdżenia. Odpowiedzi na komentarze realizowane są przez oznaczenie @użytkownik na początku treści. Każdy komentarz może otrzymywać polubienia od innych użytkowników. Admin może usunąć każdy komentarz z poziomu panelu moderacji. Firmy mogą odpowiadać na komentarze pod swoimi shortsami z oznaczeniem jako właściciel.

Treść komentarzy jest automatycznie sprawdzana przez Perspective API przed publikacją. Komentarze przekraczające próg toksyczności są oznaczane do przeglądu lub automatycznie ukrywane w zależności od konfiguracji.

#### 3.4.3 Udostępnianie

Share button generuje link do shortsa do skopiowania. Integracja z social media obejmuje Facebook, Twitter/X i WhatsApp z odpowiednimi meta tagami Open Graph dla prawidłowego podglądu. Każde udostępnienie jest trackowane w PostHog.

#### 3.4.4 Link do Sklepu

Przycisk "Kup teraz" jest widoczny podczas oglądania shortsa z opcjonalną ceną. Kliknięcie przekierowuje do zewnętrznego sklepu internetowego w nowej karcie. Każde kliknięcie jest rejestrowane jako event w PostHog dla analityki CTR.

### 3.5 System Powiadomień

System powiadomień obsługuje powiadomienia dla firm o nowych komentarzach pod ich shortsami. Użytkownicy otrzymują powiadomienia o odpowiedziach na ich komentarze. Firmy są informowane o nowych followersach profilu. Powiadomienia działają w dwóch kanałach: email przez Resend z szablonami React Email oraz in-app z ikoną dzwonka i licznikiem nieprzeczytanych.

Wysyłka emaili jest realizowana asynchronicznie przez Inngest jako background job. Inngest obsługuje retry logic w przypadku błędów dostarczenia oraz batching dla dużej liczby powiadomień.

### 3.6 System Zgłoszeń

#### 3.6.1 Zgłaszanie Shortsów

Użytkownik może zgłosić shortsa wybierając jeden z powodów: spam, nieodpowiednia treść, wprowadzające w błąd, naruszenie praw autorskich. Po osiągnięciu progu 10 zgłoszeń (wartość edytowalna przez admina) shorts jest automatycznie ukrywany i trafia do kolejki moderacji. Firma otrzymuje powiadomienie email o tymczasowym ukryciu.

#### 3.6.2 Zgłaszanie Komentarzy

Komentarze podlegają tym samym powodom zgłoszenia co shortsy. Automatyczne ukrycie następuje po określonej liczbie zgłoszeń. Perspective API dodatkowo skanuje komentarze i może automatycznie flagować treści toksyczne.

### 3.7 Dashboard Administratora

#### 3.7.1 Zarządzanie Użytkownikami

Dashboard zawiera listę wszystkich użytkowników z filtrowaniem po roli, statusie i dacie rejestracji. Admin może banować konta tymczasowo (7/30 dni) lub permanentnie. Zawieszenie konta ukrywa wszystkie shortsy użytkownika. Historia aktywności użytkownika pokazuje shortsy, komentarze, zgłoszenia.

#### 3.7.2 Moderacja Treści

Kolejka zgłoszeń shortsów wyświetla shortsy posortowane po liczbie zgłoszeń. Podgląd shortsa z kontekstem zawiera wideo, metadane, historię zgłoszeń i profil autora. Dostępne akcje to: odrzucenie zgłoszenia, usunięcie shortsa, usunięcie z ostrzeżeniem, usunięcie z banem. Moderacja komentarzy umożliwia usuwanie niepożądanych treści z logowaniem akcji.

Perspective API wspomaga moderację wyświetlając score toksyczności dla każdej treści tekstowej. Admin może ustawić próg automatycznej blokady dla wysoko ocenionych treści.

#### 3.7.3 Statystyki Globalne

Dashboard administratora zasilany przez PostHog wyświetla kluczowe metryki: liczbę użytkowników (DAU/MAU), liczbę zarejestrowanych firm, liczbę opublikowanych shortsów, całkowitą liczbę wyświetleń, liczbę kliknięć "Kup teraz" oraz przychody z płatności. Wykresy trendów w czasie pokazują wzrost platformy. PostHog zapewnia gotowe dashboardy bez potrzeby budowania własnych.

#### 3.7.4 Zarządzanie Shortsami

Lista wszystkich shortsów z możliwością filtrowania po statusie, kategorii, firmie i dacie. Dla każdego shortsa dostępne są statystyki z Mux Data: liczba wyświetleń, czas oglądania, quality of experience. Dodatkowe metryki z PostHog obejmują reakcje, komentarze i kliknięcia. Status shortsa może być: Draft, Processing, Published, Blocked.

#### 3.7.5 Konfiguracja Systemu

Panel konfiguracji umożliwia edycję maksymalnego czasu trwania shortsa (domyślnie 60 sekund), maksymalnego rozmiaru pliku (domyślnie 100 MB), progu zgłoszeń dla automatycznej blokady (domyślnie 10) oraz progu Perspective API dla auto-moderacji (domyślnie 0.7). Admin zarządza również listą kategorii i popularnych tagów.

### 3.8 Dashboard Firmy

Dashboard firmy wyświetla przegląd statystyk własnych shortsów zasilany przez PostHog i Mux Data. Firma może zarządzać opublikowanymi shortsami: edytować metadane, ukrywać, usuwać. Upload nowych shortsów odbywa się przez direct upload do Mux z progress barem. Edycja profilu firmowego pozwala na zmianę logo, opisu, danych kontaktowych. Sekcja komentarzy pokazuje ostatnie komentarze pod shortsami firmy z możliwością odpowiedzi. Historia płatności i faktury są dostępne przez Stripe Customer Portal. Analityka zawiera wyświetlenia, CTR (kliknięcia/wyświetlenia), engagement rate, najlepiej performujące shortsy.

---

## 4. Specyfikacja Techniczna

### 4.1 Stack Technologiczny

Frontend oparty jest na Next.js 14+ z App Router, React 18+ z Server Components, TypeScript dla type safety oraz Tailwind CSS z komponentami shadcn/ui dla spójnego designu.

Backend wykorzystuje Next.js Server Actions dla mutacji danych, API Routes dla webhooków i integracji zewnętrznych oraz Prisma ORM dla abstrakcji bazy danych z type-safe queries.

Baza danych to Neon DB, czyli serverless PostgreSQL z automatycznym skalowaniem. Neon oferuje database branching dla feature development, connection pooling przez PgBouncer oraz point-in-time recovery.

Storage plików realizowany jest przez Cloudflare R2, kompatybilny z S3 API. R2 oferuje zero egress fees, co jest kluczowe dla storage thumbnailów i assetów. Główne pliki wideo przechowywane są przez Mux.

Przetwarzanie wideo obsługuje Mux, który zapewnia direct upload z przeglądarki użytkownika bez obciążania serwera. Automatyczne transkodowanie do multiple quality levels (1080p, 720p, 480p) z adaptive bitrate streaming (HLS). Mux Player to gotowy, responsywny player wideo z analytics. Mux Data dostarcza szczegółowe metryki video performance: buffering, quality, engagement.

Płatności obsługuje Stripe z Checkout Session dla płatności jednorazowych (pay-per-video). Stripe Invoicing automatycznie generuje faktury. Webhooks przetwarzane są przez Inngest dla reliability.

Autentykacja oparta jest na NextAuth.js z obsługą email/hasło oraz OAuth przez Google i Facebook. JWT dla sesji z secure cookies. Magic links jako opcja dla łatwiejszego logowania.

Hosting na Vercel zapewnia zero-config deployment z git push. Edge Functions dla niskiej latencji na całym świecie. Automatic scaling bez zarządzania infrastrukturą. Preview deployments dla każdego pull requesta.

Kolejkowanie zadań realizuje Inngest jako event-driven background jobs. Inngest obsługuje przetwarzanie webhooków (Stripe, Mux), wysyłkę emaili przez Resend, scheduled jobs dla cleanupów, retry logic z exponential backoff.

Email wysyłany jest przez Resend z React Email dla szablonów. Obsługiwane typy to: transakcyjne (weryfikacja, reset hasła), powiadomienia (nowy komentarz, follower), marketing (opcjonalne). Wysoka deliverability i analytics otwarć.

Analityka oparta jest na PostHog, który oferuje product analytics z custom events, dashboardy z wizualizacjami, session recording dla UX research, feature flags dla gradual rollout oraz A/B testing dla optymalizacji.

Moderacja AI wykorzystuje Perspective API od Google do analizy toksyczności tekstu. Automatyczne sprawdzanie komentarzy i opisów przed publikacją. Konfigurowalny próg dla auto-blokady. Wsparcie dla języka polskiego.

### 4.2 Architektura Systemu

#### 4.2.1 Architektura Wysokiego Poziomu

System oparty jest na architekturze serverless-first z Next.js na Vercel jako główną platformą. Wszystkie komponenty infrastrukturalne są zarządzanymi usługami SaaS.

Warstwa prezentacji wykorzystuje Next.js App Router dla SSR (Server-Side Rendering) i RSC (React Server Components). Mux Player dla wideo z adaptive streaming. Tailwind CSS z shadcn/ui dla komponentów.

Warstwa biznesowa opiera się na Next.js Server Actions dla bezpiecznych mutacji. API Routes dla webhooków z Stripe, Mux i innych serwisów. Prisma ORM dla type-safe database operations.

Warstwa danych to Neon DB jako główna baza danych PostgreSQL. Cloudflare R2 dla plików statycznych (thumbnails, avatary). Mux dla video storage i streaming.

Warstwa background jobs wykorzystuje Inngest dla event-driven architecture. Obsługuje przetwarzanie webhooków, wysyłkę emaili, scheduled tasks.

Warstwa dostarczania treści opiera się na Vercel Edge Network dla globalnego CDN. Mux dla video delivery z HLS. Cloudflare dla R2 asset delivery.

Warstwa analityki wykorzystuje PostHog dla product analytics i dashboardów. Mux Data dla video-specific metrics.

#### 4.2.2 Schemat Bazy Danych

Główne tabele i ich pola są następujące:

Tabela users zawiera: id, email, password_hash, name, role (user/company/admin), company_name, company_description, company_logo_url, created_at, updated_at, banned_at, suspended_until, email_verified_at.

Tabela shorts zawiera: id, user_id (FK), title, description, mux_asset_id, mux_playback_id, thumbnail_url, duration, product_url, product_price, category_id (FK), status (draft/processing/published/blocked), location_city, location_country, views_count, likes_count, created_at, published_at.

Tabela categories zawiera: id, name, slug, icon, sort_order.

Tabela tags zawiera: id, name, slug.

Tabela shorts_tags to relacja wiele-do-wielu: shorts_id (FK), tag_id (FK).

Tabela reactions zawiera: id, user_id (FK), shorts_id (FK), type (like/dislike/emoji), emoji_code, created_at.

Tabela comments zawiera: id, user_id (FK), shorts_id (FK), content, reply_to_user_id (FK), perspective_score, likes_count, hidden_at, created_at.

Tabela follows zawiera: id, follower_id (FK), following_id (FK), created_at.

Tabela reports zawiera: id, reporter_id (FK), reported_type (short/comment), reported_id, reason, status (pending/resolved/dismissed), created_at, resolved_at, resolved_by (FK).

Tabela notifications zawiera: id, user_id (FK), type, related_id, read_at, created_at.

Tabela payments zawiera: id, user_id (FK), shorts_id (FK), stripe_payment_id, amount, currency, status, created_at.

### 4.3 Przetwarzanie Wideo

#### 4.3.1 Pipeline Uploadu z Mux

Użytkownik wybiera plik wideo w formularzu uploadu. Frontend wywołuje API Route, która tworzy Mux Direct Upload URL. Plik jest uploadowany bezpośrednio z przeglądarki do Mux, nie obciążając serwera aplikacji. Progress bar pokazuje postęp uploadu. Po zakończeniu Mux wysyła webhook z asset_id.

Inngest odbiera webhook i tworzy rekord shortsa ze statusem "processing". Mux automatycznie transkoduje wideo do różnych jakości. Po zakończeniu transkodowania Mux wysyła kolejny webhook. Inngest aktualizuje status na "ready" i generuje thumbnail URL.

#### 4.3.2 Transkodowanie przez Mux

Mux automatycznie przetwarza wideo bez potrzeby konfiguracji FFmpeg. Generowane są jakości: 1080p Full HD dla połączeń szybkich, 720p HD jako domyślna jakość, 480p SD dla wolnych połączeń i oszczędzania danych. Thumbnail generowany jest automatycznie z pierwszej klatki. Format wyjściowy to HLS dla kompatybilności ze wszystkimi urządzeniami.

#### 4.3.3 Adaptive Streaming

Mux Player automatycznie dobiera jakość na podstawie prędkości połączenia. HLS (HTTP Live Streaming) zapewnia płynne odtwarzanie. Preloading następnych shortsów realizowany jest przez prefetch playback URLs. Mux Data zbiera metryki quality of experience w czasie rzeczywistym.

### 4.4 Bezpieczeństwo

#### 4.4.1 Autentykacja i Autoryzacja

NextAuth.js zarządza sesjami z JWT w secure, httpOnly cookies. Hashowanie haseł odbywa się przez bcrypt z salt rounds 12. OAuth 2.0 obsługuje logowanie przez Google i Facebook. RBAC (Role-Based Access Control) definiuje role: user, company, admin z różnymi uprawnieniami. Weryfikacja email realizowana jest przez magic link wysyłany przez Resend.

#### 4.4.2 Ochrona Danych

HTTPS jest wymuszony wszędzie przez Vercel automatycznie. Rate limiting na API Routes chroni przed abuse. CSRF protection jest wbudowany w Next.js Server Actions. Input validation przez Zod dla wszystkich formularzy. XSS protection zapewnia React przez domyślne escapowanie. SQL injection protection realizuje Prisma przez parameterized queries.

#### 4.4.3 RODO/GDPR Compliance

Cookie consent banner z opcją granularnej zgody. Zgoda na geolokalizację z wyjaśnieniem celu. Możliwość usunięcia konta z kaskadowym usunięciem wszystkich danych. Export danych użytkownika na żądanie w formacie JSON. Polityka prywatności i regulamin z wersjonowaniem.

### 4.5 Wydajność i Skalowalność

#### 4.5.1 Strategia Cache

Vercel Edge Cache dla statycznych stron i assets. Neon connection pooling dla efektywnego wykorzystania połączeń DB. React Query na froncie dla client-side cache z stale-while-revalidate. ISR (Incremental Static Regeneration) dla stron kategorii i profili firm. Mux CDN dla globalnej dystrybucji wideo z niską latencją.

#### 4.5.2 Optymalizacja Bazy Danych

Neon serverless automatycznie skaluje w zależności od obciążenia. Indeksy na często używanych kolumnach: shorts.status, shorts.category_id, shorts.location_city, shorts.location_country, users.email (unique). Connection pooling przez Neon Proxy. Cursor-based pagination dla infinite scroll bez performance degradation.

#### 4.5.3 Monitoring i Observability

Vercel Analytics dla web vitals i performance metrics. Sentry dla error tracking z source maps. PostHog dla product analytics i user behavior. Mux Data dla video-specific metrics (buffering, quality, engagement). Inngest Dashboard dla monitoring background jobs.

---

## 5. Plan Wdrożenia

### 5.1 Fazy Projektu

**Faza 1: MVP** trwa 3-4 tygodnie (140 godzin). W pierwszym tygodniu realizowany jest setup projektu: Next.js, Vercel, Neon DB, Prisma, Mux, podstawowa struktura. W drugim tygodniu implementowany jest system autentykacji NextAuth.js z email/hasło oraz integracja uploadu wideo z Mux. W trzecim tygodniu powstaje feed shortsów z Mux Player i infinite scroll oraz profile firm i podstawowy dashboard z PostHog. W czwartym tygodniu przeprowadzane jest UI/UX polish z Tailwind i shadcn/ui oraz testing i bugfixing.

**Faza 2: Core Features** trwa 2.5-3 tygodnie (118 godzin). Obejmuje system komentarzy z integracją Perspective API dla moderacji AI, system reakcji (like, dislike, emoji), filtrowanie po kategoriach, tagach i geolokalizacji, system zgłoszeń z automatyczną blokadą, dashboard administratora oraz integrację Stripe dla płatności z Inngest dla webhooków.

**Faza 3: Advanced Features** trwa 3-4 tygodnie (136 godzin). Realizowany jest system powiadomień przez Resend z szablonami React Email, zaawansowane dashboardy analityczne z PostHog i Mux Data, OAuth z Google i Facebook, optymalizacja wydajności (cache, ISR, connection pooling), SEO z meta tagami i Open Graph oraz finalne testy i polish.

**Faza 4: Mobile App (opcjonalna)** trwa 3.5-4.5 tygodnia (152 godziny). Obejmuje React Native setup z Expo, implementację core features z Mux native SDK, push notifications przez Firebase/OneSignal oraz deployment do App Store i Google Play.

### 5.2 Wymagania Zasobowe

#### 5.2.1 Zespół

Projekt wymaga jednego Full-stack Developera biegłego w Next.js, React i TypeScript, pracującego z wsparciem Claude Code AI dla zwiększonej produktywności. Opcjonalnie UI/UX Designer dla Fazy 1 i QA Tester dla Fazy 3+.

#### 5.2.2 Koszty Infrastruktury SaaS (miesięcznie)

Vercel Pro kosztuje około 20 USD i zapewnia hosting, edge functions, preview deployments. Neon DB Launch kosztuje około 19 USD za 10GB storage z autoscaling. Mux to model pay-per-use z szacunkowym kosztem 20-100 USD w zależności od wolumenu wideo. Resend w planie Free/Pro kosztuje 0-20 USD za emaile transakcyjne. PostHog Free/Growth kosztuje 0-50 USD za analytics i dashboardy. Inngest Free/Pro kosztuje 0-25 USD za background jobs. Cloudflare R2 to około 5-15 USD za storage z zero egress. Perspective API oferuje darmowy tier. Stripe pobiera standardową prowizję 2.9% + 0.30 USD od transakcji.

Całkowity szacunkowy koszt miesięczny na starcie wynosi 65-150 USD. Przy większej skali koszt wzrasta do 150-300 USD miesięcznie, głównie przez Mux (video processing) i PostHog (analytics).

### 5.3 Kluczowe API Endpoints

#### 5.3.1 Autentykacja

POST /api/auth/register obsługuje rejestrację nowego użytkownika z weryfikacją email przez Resend. POST /api/auth/login realizuje logowanie z tworzeniem sesji JWT. POST /api/auth/logout unieważnia sesję. POST /api/auth/reset-password wysyła email z linkiem reset przez Resend.

#### 5.3.2 Shorts

GET /api/shorts pobiera feed z cursor-based paginacją i filtrami. GET /api/shorts/:id zwraca szczegóły shortsa z Mux playback URL. POST /api/shorts tworzy draft i zwraca Mux direct upload URL. PATCH /api/shorts/:id aktualizuje metadane shortsa. DELETE /api/shorts/:id usuwa shortsa i asset z Mux. POST /api/shorts/:id/publish publikuje shortsa po płatności Stripe.

#### 5.3.3 Interakcje

POST /api/shorts/:id/react dodaje lub zmienia reakcję. GET /api/shorts/:id/comments pobiera komentarze z paginacją. POST /api/shorts/:id/comments dodaje komentarz z walidacją Perspective. POST /api/shorts/:id/report zgłasza shortsa. POST /api/shorts/:id/track-click rejestruje kliknięcie w PostHog.

#### 5.3.4 Profile i Follow

GET /api/users/:id/profile pobiera profil publiczny. PATCH /api/users/me/profile aktualizuje własny profil. POST /api/users/:id/follow dodaje follow z powiadomieniem. DELETE /api/users/:id/follow usuwa follow.

#### 5.3.5 Webhooks (obsługiwane przez Inngest)

POST /api/webhooks/stripe obsługuje payment events. POST /api/webhooks/mux obsługuje video processing events. Inngest zapewnia retry logic i idempotency.

#### 5.3.6 Admin

GET /api/admin/stats zwraca statystyki z PostHog. GET /api/admin/reports pobiera kolejkę zgłoszeń. PATCH /api/admin/reports/:id/resolve rozwiązuje zgłoszenie z akcją. PATCH /api/admin/users/:id/ban banuje użytkownika. DELETE /api/admin/comments/:id usuwa komentarz.

---

## 6. Ryzyka i Mitygacja

**Koszty Mux przy dużym wolumenie** stanowią średnie ryzyko. Mitygacja obejmuje monitorowanie usage w Mux Dashboard, ustawienie alertów budżetowych oraz rozważenie własnego transkodowania FFmpeg przy bardzo dużej skali.

**Vendor lock-in na usługi SaaS** to średnie ryzyko. Mitygacja polega na używaniu standardowych interfejsów (S3 API dla storage, PostgreSQL dla bazy), dokumentowaniu integracji oraz projektowaniu z myślą o możliwości migracji.

**Spam i nieodpowiednie treści** stanowią wysokie ryzyko. Mitygacja obejmuje Perspective API dla automatycznej moderacji, system zgłoszeń z automatyczną blokadą, review queue dla adminów oraz rate limiting dla uploadu.

**Limity free tier usług SaaS** to niskie ryzyko. Mitygacja polega na monitorowaniu usage, planowaniu budżetu na scale oraz użyciu alertów przed przekroczeniem limitów.

**Problemy z video playback** stanowią niskie ryzyko. Mux zapewnia 99.99% uptime SLA, adaptive streaming dla różnych połączeń oraz globalny CDN dla niskiej latencji.

---

## 7. Podsumowanie

Dokument przedstawia kompleksową specyfikację aplikacji do przeglądania krótkich filmów promocyjnych produktów. Projekt wykorzystuje nowoczesną architekturę SaaS-first z Next.js na Vercel jako główną platformą, eliminując potrzebę zarządzania infrastrukturą serwerową.

### 7.1 Kluczowe Cechy Techniczne

Zero DevOps dzięki Vercel i managed services - deployment to git push. Profesjonalne przetwarzanie wideo przez Mux bez konfiguracji FFmpeg. Serverless database przez Neon z automatycznym skalowaniem. AI-powered moderacja przez Perspective API. Event-driven architecture przez Inngest dla reliable background jobs. Gotowe dashboardy analityczne przez PostHog.

### 7.2 Kluczowe Cechy Produktowe

Prosty model biznesowy pay-per-video bez subskrypcji. Geolokalizacja jako kluczowy filtr dla lokalnych produktów. Profile firm podobne do kanałów YouTube z statystykami. Zaawansowany system moderacji z AI i zgłoszeniami. Bezproblemowe płatności z automatycznymi fakturami przez Stripe.

### 7.3 Następne Kroki

Zatwierdzenie dokumentu przez stakeholderów. Założenie kont w usługach SaaS (Vercel, Neon, Mux, Resend, PostHog, Inngest, Cloudflare). Setup środowiska deweloperskiego z Vercel CLI. Rozpoczęcie prac nad MVP (Faza 1) - 3-4 tygodnie. Regularne code reviews i testing. Beta launch i zbieranie feedbacku.

---

**Koniec Dokumentu**

Data wygenerowania: 28.11.2025  
Wersja: 2.0 (SaaS Stack)  
Stack: Next.js | Neon DB | Vercel | Mux | Resend | PostHog | Inngest | Perspective API | Cloudflare R2
