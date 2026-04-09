# Brief: Core + Auth

> **ŹRÓDŁO:** `.ai-project-planner/projects/videoshorts/stages/stage-01-core-auth/spec.md`
> **Import:** 2025-11-28
> **Status:** Synchronized

---

<!--
  Ten plik jest referencją do specyfikacji etapu z AI Project Planner.
  Główne źródło prawdy: .ai-project-planner/projects/videoshorts/stages/stage-01-core-auth/spec.md

  W przypadku zmian w specyfikacji, uruchom ponownie: /ai-import-stage videoshorts 1 --force
-->

# Etap 1: Core + Auth

**Projekt:** VideoShorts
**Priorytet:** P0 (Critical - MVP)
**Zależności:** Brak (pierwszy etap)
**Szacowany czas:** 2-3 tygodnie
**Status:** ⚪ Planowany

---

## 1. Cel Etapu

Zbudowanie fundamentów aplikacji: system autentykacji (email + OAuth), profile użytkowników, podstawowy layout aplikacji z nawigacją, dark mode, oraz setup infrastruktury i18n. Ten etap stanowi fundament dla wszystkich kolejnych funkcjonalności.

### Kluczowe Wartości:
- Bezpieczna autentykacja z obsługą OAuth (Google, Facebook)
- Responsywny layout działający na desktop i mobile
- Gotowa architektura do rozbudowy (Next.js 14+ App Router)
- Dark mode jako feature bazowy

---

## 2. Funkcjonalności

### 2.1 Autentykacja

**Email + Password:**
- Rejestracja z walidacją email (link aktywacyjny)
- Logowanie z rate limiting (5 prób/15 min)
- Wylogowanie
- Reset hasła (forgot password flow)
- Remember me (sesja 30 dni)

**OAuth (Social Login):**
- Google OAuth 2.0
- Facebook OAuth 2.0
- Automatyczne tworzenie profilu po pierwszym logowaniu
- Łączenie kont (link OAuth account z istniejącym email/password)

**Bezpieczeństwo:**
- bcrypt password hashing (cost 12)
- CSRF protection (NextAuth built-in)
- Rate limiting na endpointach auth
- Session management (JWT stored in HTTP-only cookies)

### 2.2 Profile Użytkownika

**Podstawowe dane:**
- Display name (edytowalny)
- Email (wyświetlany, niemodyfikowalny po rejestracji)
- Avatar (upload do Cloudflare R2, max 2MB)
- Bio (max 500 znaków)
- Lokalizacja (Mapbox autocomplete, zapisywana jako coordinates + address)

**Preferencje:**
- Dark mode toggle
- Preferowane kategorie (setup dla przyszłego personalizowanego feedu)
- Ustawienia powiadomień (placeholder na etap 8)

**Zarządzanie kontem:**
- Zmiana hasła (tylko dla email/password users)
- Zmiana avatara
- Usunięcie konta (soft delete, GDPR compliance)

### 2.3 Layout Aplikacji

**Navigation:**
- Header z logo, search bar (placeholder), user menu
- Sidebar (mobile: drawer) z nawigacją:
  - Home (Feed)
  - Explore (categories)
  - Following (wymagane logowanie)
  - Dashboard (tylko dla firm - etap 2)
  - Admin (tylko dla adminów - etap 2)
- Footer z linkami (Terms, Privacy, Contact)

**Responsive Design:**
- Mobile-first approach (Tailwind breakpoints)
- Touch-friendly controls (min 44x44px)
- Bottom navigation na mobile (optional)

**Dark Mode:**
- Toggle w user menu
- Zapisywany w user preferences
- next-themes integration (class-based)
- Wszystkie kolory Tailwind dostosowane do dark mode

### 2.4 i18n Setup

**Infrastruktura:**
- next-intl configured
- Locale detection (domyślnie: PL)
- URL structure: `/[locale]/...` (np. `/pl/login`, `/en/login`)
- Language switcher w footer (przygotowany, ale tylko PL aktywne w MVP)

**Tłumaczenia:**
- Polski (kompletny)
- Angielski (przygotowany struktura, tłumaczenia w post-MVP)

### 2.5 Deployment Pipeline

**Vercel Setup:**
- Połączenie z GitHub repo
- Auto-deploy z `main` (production)
- Auto-deploy z `staging` (staging env)
- Preview deploys dla PRs
- Environment variables skonfigurowane

**Database:**
- Neon DB provision
- Prisma migrations (initial schema)
- Connection pooling configured

**Monitoring:**
- Vercel Analytics enabled
- PostHog initialized (basic events)

---

## 3. User Stories

### US-01-01: Rejestracja przez Email
**Jako** nowy użytkownik
**Chcę** zarejestrować się przez email i hasło
**Aby** uzyskać dostęp do platformy

**Kryteria akceptacji:**
- [ ] Formularz rejestracji z polami: email, hasło, powtórz hasło
- [ ] Walidacja: email format, hasło min 8 znaków, hasła się zgadzają
- [ ] CAPTCHA na formularzu (post-MVP: opcjonalne)
- [ ] Po rejestracji: email weryfikacyjny wysłany (Resend)
- [ ] Link weryfikacyjny aktywuje konto (token expiry: 24h)
- [ ] Po weryfikacji: redirect do onboarding (welcome screen)
- [ ] Error handling: email already exists, weak password

### US-01-02: Logowanie przez Email
**Jako** zarejestrowany użytkownik
**Chcę** zalogować się email/hasłem
**Aby** uzyskać dostęp do swojego konta

**Kryteria akceptacji:**
- [ ] Formularz logowania: email, hasło, remember me checkbox
- [ ] Rate limiting: 5 failed attempts → 15 min lockout
- [ ] Remember me: sesja 30 dni (default: 7 dni)
- [ ] Redirect do strony głównej (feed) po sukcesie
- [ ] Redirect do poprzedniej strony jeśli user próbował dostać się do protected page
- [ ] Error messages: invalid credentials, account not verified, account locked

### US-01-03: Logowanie przez Google
**Jako** nowy lub istniejący użytkownik
**Chcę** zalogować się przez Google
**Aby** uniknąć tworzenia kolejnego hasła

**Kryteria akceptacji:**
- [ ] Przycisk "Continue with Google" na login/signup pages
- [ ] OAuth flow: redirect → Google consent screen → callback
- [ ] Jeśli nowy user: automatycznie tworzony profil (email, avatar z Google)
- [ ] Jeśli user istnieje z tym email: łączenie kont (link OAuth account)
- [ ] Po sukcesie: redirect do feed lub onboarding (jeśli nowy)

### US-01-04: Logowanie przez Facebook
**Jako** nowy lub istniejący użytkownik
**Chcę** zalogować się przez Facebook
**Aby** korzystać z social login

**Kryteria akceptacji:**
- [ ] Przycisk "Continue with Facebook"
- [ ] OAuth flow analogiczny do Google
- [ ] Email scope requested (wymagane)
- [ ] Avatar pobierany z Facebook profile picture

### US-01-05: Reset Hasła
**Jako** użytkownik który zapomniał hasła
**Chcę** zresetować hasło przez email
**Aby** odzyskać dostęp do konta

**Kryteria akceptacji:**
- [ ] Link "Forgot password?" na stronie logowania
- [ ] Formularz: email input
- [ ] Email z linkiem resetującym (token expiry: 1h)
- [ ] Strona reset z nowym hasłem (2 pola: hasło + powtórz)
- [ ] Walidacja: min 8 znaków, hasła się zgadzają
- [ ] Po sukcesie: hasło zmienione, wszystkie sesje invalidowane
- [ ] Security: nie ujawniamy czy email istnieje w systemie

### US-01-06: Edycja Profilu
**Jako** zalogowany użytkownik
**Chcę** edytować swój profil
**Aby** personalizować swoje konto

**Kryteria akceptacji:**
- [ ] Strona `/settings/profile` z formularzem:
  - Display name (max 50 znaków)
  - Bio (max 500 znaków, textarea)
  - Lokalizacja (Mapbox autocomplete, zapisuje coordinates)
  - Avatar (upload, preview, max 2MB, PNG/JPG)
- [ ] Real-time walidacja
- [ ] Save button → API request → success toast
- [ ] Avatar upload:
  - Direct upload do R2 (presigned URL)
  - Client-side resize (max 400x400px)
  - Loading state podczas uploadu

### US-01-07: Zmiana Hasła
**Jako** użytkownik z email/password loginem
**Chcę** zmienić hasło
**Aby** utrzymać bezpieczeństwo konta

**Kryteria akceptacji:**
- [ ] Strona `/settings/security`
- [ ] Formularz: current password, new password, confirm new password
- [ ] Walidacja: current password correct, new password min 8 znaków
- [ ] Po sukcesie: hasło zmienione, email notification wysłany
- [ ] Opcja "Wyloguj ze wszystkich urządzeń" (invalidate all sessions)
- [ ] Nie pokazuj tej opcji dla OAuth-only users

### US-01-08: Dark Mode
**Jako** użytkownik
**Chcę** włączyć dark mode
**Aby** zmniejszyć zmęczenie oczu wieczorem

**Kryteria akceptacji:**
- [ ] Toggle w user menu (header)
- [ ] Smooth transition między trybami (CSS transitions)
- [ ] Zapisywanie preferencji w DB (dla zalogowanych)
- [ ] LocalStorage fallback (dla niezalogowanych)
- [ ] Wszystkie komponenty wspierają dark mode (Tailwind dark: variants)
- [ ] System preference detection (domyślnie: auto-detect OS preference)

### US-01-09: Usunięcie Konta
**Jako** użytkownik
**Chcę** usunąć swoje konto
**Aby** moje dane zostały usunięte (GDPR)

**Kryteria akceptacji:**
- [ ] Opcja "Delete account" w `/settings/security`
- [ ] Confirmation modal z ostrzeżeniem (nieodwracalne)
- [ ] Wymagane potwierdzenie hasłem (dla email/password users)
- [ ] Soft delete: user.deletedAt = now, email anonymized
- [ ] Scheduled hard delete po 30 dniach (background job)
- [ ] Email confirmation: "Your account has been deleted"
- [ ] Natychmiastowe wylogowanie

---

## 4. Wymagania Biznesowe

### 4.1 Bezpieczeństwo
- Hasła muszą być hashowane bcrypt (cost factor 12)
- Email musi być unikalny w systemie
- Rate limiting:
  - Login attempts: 5 per 15 min per IP
  - Signup: 3 per hour per IP
  - Password reset requests: 3 per hour per email
- CSRF protection enabled (NextAuth default)
- Session timeout: 7 dni (default), 30 dni z "remember me"

### 4.2 Walidacja
- Email: RFC 5322 compliant
- Hasło: min 8 znaków, zalecane: litera + cyfra + znak specjalny
- Display name: min 2, max 50 znaków
- Bio: max 500 znaków
- Avatar: max 2MB, PNG/JPG/WebP, min 100x100px

### 4.3 Compliance
- GDPR: right to be forgotten (delete account flow)
- Cookie consent: essential cookies only (session, CSRF)
- Privacy policy i Terms of Service linki w footer
- Email verification required przed korzystaniem z platformy

### 4.4 Performance
- Login request: < 500ms p95
- Session validation: < 100ms p95
- Avatar upload: < 3s dla 2MB image
- Page load (LCP): < 2s

---

## 5. Wymagania Techniczne

### 5.1 Tech Stack (Ten Etap)

**Framework:**
- Next.js 14.2+ (App Router)
- React 19+
- TypeScript 5.3+

**Authentication:**
- NextAuth.js v5 (Auth.js)
- bcryptjs dla password hashing
- jose dla JWT handling

**Database:**
- Neon DB (PostgreSQL 15+)
- Prisma ORM 5.8+
- Migrations setup

**Styling:**
- Tailwind CSS 3.4+
- shadcn/ui components
- next-themes (dark mode)

**i18n:**
- next-intl

**Storage:**
- Cloudflare R2 (avatars)
- Presigned URLs dla direct upload

**Email:**
- Resend (transactional emails)
- React Email templates

**Monitoring:**
- Vercel Analytics
- PostHog (basic setup)

### 5.2 Database Schema (Prisma)

```prisma
enum Role {
  USER
  COMPANY
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   // nullable for OAuth users
  role          Role      @default(USER)
  emailVerified DateTime?
  deletedAt     DateTime? // soft delete
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile  UserProfile?
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([role])
  @@index([deletedAt])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String  // "google", "facebook", "credentials"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String   // email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?  // R2 URL
  bio         String?  @db.Text
  location    String?  // Human-readable address
  latitude    Float?
  longitude   Float?
  preferences Json?    // {darkMode: boolean, categories: string[]}
  darkMode    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([latitude, longitude]) // PostGIS index
}
```

### 5.3 API Endpoints

**Authentication:**
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/providers (NextAuth OAuth providers)
GET    /api/auth/callback/google
GET    /api/auth/callback/facebook
```

**User Profile:**
```
GET    /api/users/me
PATCH  /api/users/me
DELETE /api/users/me
POST   /api/users/me/avatar (upload presigned URL)
PATCH  /api/users/me/password
```

### 5.4 UI Components (shadcn/ui)

**Forms:**
- Input (email, password, text)
- Textarea (bio)
- Button (variants: default, outline, ghost, destructive)
- Label
- Form (react-hook-form integration)

**Layout:**
- Sheet (mobile drawer)
- DropdownMenu (user menu)
- Avatar
- Separator

**Feedback:**
- Toast (success, error notifications)
- Dialog (confirmation modals)
- Alert (info boxes)

**Theme:**
- ThemeProvider (next-themes)
- ThemeToggle component

### 5.5 Pages & Routes

```
/
├── /[locale]/
│   ├── login                      # Login page
│   ├── signup                     # Signup page
│   ├── verify-email               # Email verification page
│   ├── forgot-password            # Forgot password form
│   ├── reset-password             # Reset password form (with token)
│   ├── /                          # Home (Feed - placeholder w tym etapie)
│   └── /settings/
│       ├── profile                # Edit profile
│       ├── security               # Change password, delete account
│       └── preferences            # Notifications, etc. (placeholder)
```

### 5.6 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="videoshorts-avatars"
R2_PUBLIC_URL="https://avatars.videoshorts.pl"

# Resend
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="noreply@videoshorts.pl"

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

---

## 6. Kryteria Akceptacji (Etap jako całość)

### Funkcjonalne:
- [ ] Użytkownik może zarejestrować się przez email i hasło
- [ ] Użytkownik może zalogować się przez email/hasło, Google, lub Facebook
- [ ] Email weryfikacyjny działa (link aktywuje konto)
- [ ] Reset hasła działa (email → link → nowe hasło)
- [ ] Użytkownik może edytować profil (display name, bio, location, avatar)
- [ ] Avatar upload działa (max 2MB, upload do R2)
- [ ] Zmiana hasła działa (dla email/password users)
- [ ] Usunięcie konta działa (soft delete, GDPR compliant)
- [ ] Dark mode działa (toggle, zapisywany w preferences)
- [ ] Layout responsywny (mobile, tablet, desktop)
- [ ] Navigation działa (header, sidebar/drawer, footer)
- [ ] i18n setup gotowy (routing, locale detection, Polski aktywny)

### Niefunkcjonalne:
- [ ] Login request < 500ms p95
- [ ] Page load (LCP) < 2s
- [ ] Avatar upload < 3s dla 2MB
- [ ] Mobile-friendly (min 44x44px touch targets)
- [ ] Dark mode smooth transition (no flash)
- [ ] Accessible (keyboard navigation, screen reader friendly)

### Bezpieczeństwo:
- [ ] Rate limiting działa (5 login attempts → lockout)
- [ ] Passwords hashed bcrypt (cost 12)
- [ ] CSRF protection enabled
- [ ] Session cookies HTTP-only, Secure
- [ ] OAuth flow secure (state parameter, PKCE)
- [ ] No sensitive data w console.log (production)

### DevOps:
- [ ] Deployed na Vercel (staging + production)
- [ ] Environment variables skonfigurowane
- [ ] Prisma migrations uruchomione
- [ ] Database backups enabled (Neon auto-backup)
- [ ] Vercel Analytics działa
- [ ] PostHog tracking basic events (signup, login)

### Dokumentacja:
- [ ] README zaktualizowane (setup instructions)
- [ ] `.env.example` kompletny
- [ ] Prisma schema udokumentowane (komentarze)
- [ ] API endpoints udokumentowane (OpenAPI/Swagger - opcjonalne)

---

## 7. Out of Scope (Nie w tym etapie)

- ❌ Profile firmowe (Etap 2)
- ❌ Weryfikacja VIES (Etap 2)
- ❌ Upload shortsów (Etap 3)
- ❌ Feed z shortsami (Etap 4)
- ❌ Komentarze, likes (Etap 5)
- ❌ Panel admina (Etap 2)
- ❌ Powiadomienia email (poza auth emails) (Etap 8)
- ❌ 2FA (Post-MVP)
- ❌ Tłumaczenia na angielski (Post-MVP)

---

## 8. Zależności

### External Services:
- **Neon DB:** PostgreSQL database (provision przed rozpoczęciem)
- **Vercel:** Hosting (GitHub repo połączony)
- **Cloudflare R2:** Avatar storage (bucket utworzony)
- **Resend:** Email delivery (account + domain verification)
- **Google Cloud:** OAuth credentials (create OAuth 2.0 client)
- **Facebook Developers:** OAuth app (create app, get credentials)
- **PostHog:** Analytics account (optional, można odłożyć)

### Setup Required:
1. Neon DB provision + connection string
2. Vercel project creation + GitHub integration
3. R2 bucket creation + CORS setup
4. Resend domain verification
5. Google OAuth credentials (Authorized redirect URIs)
6. Facebook OAuth app (Valid OAuth Redirect URIs)
7. Environment variables w Vercel dashboard

---

## 9. Ryzyka i Mitygacje

### Ryzyko 1: OAuth Provider Outages
**Prawdopodobieństwo:** Niskie
**Wpływ:** Średni
**Mitygacja:**
- Zawsze oferuj email/password jako fallback
- Multi-provider support (Google + Facebook)
- Clear error messages ("Google login unavailable, try email/password")

### Ryzyko 2: Email Delivery Failures (Resend)
**Prawdopodobieństwo:** Niskie
**Wpływ:** Wysoki
**Mitygacja:**
- Retry logic w Resend library (automatic)
- Manual resend button na verify-email page
- Admin tool do manual email verification (post-MVP)
- Monitoring: alert on high failure rate

### Ryzyko 3: R2 Upload Failures
**Prawdopodobieństwo:** Niskie
**Wpływ:** Niski
**Mitygacja:**
- Client-side retry (1 automatic retry)
- Clear error message
- Fallback: default avatar

### Ryzyko 4: Rate Limiting Too Aggressive
**Prawdopodobieństwo:** Średnie
**Wpływ:** Średni
**Mitygacja:**
- Start z liberalnymi limitami, tighten w post-MVP
- Whitelist dla testowych kont
- Clear messaging: "Too many attempts, try again in X minutes"

### Ryzyko 5: Dark Mode Visual Bugs
**Prawdopodobieństwo:** Średnie
**Wpływ:** Niski
**Mitygacja:**
- Thorough manual testing w obu trybach
- Tailwind dark: classes na wszystkich komponentach
- Design system review (shadcn/ui wspiera dark mode out-of-box)

---

## 10. Metryki Sukcesu (Ten Etap)

### Technical Metrics:
- Login success rate > 95%
- Email verification rate > 80% (w 24h)
- Avatar upload success rate > 90%
- Page load (LCP) < 2s (p95)
- Zero critical security vulnerabilities

### User Metrics (Post-Launch):
- Registration completion rate > 70%
- OAuth adoption > 40% (z tych co się rejestrują)
- Profile completion rate > 60% (wypełniony avatar + bio)

---

## 11. Harmonogram (Przykładowy)

### Tydzień 1: Setup + Auth Foundation
- **Dni 1-2:** Project setup, Prisma schema, Vercel deployment
- **Dni 3-5:** NextAuth config, email/password auth, email verification

### Tydzień 2: OAuth + Profile
- **Dni 1-2:** Google + Facebook OAuth
- **Dni 3-4:** User profile CRUD, avatar upload
- **Dzień 5:** Dark mode, preferences

### Tydzień 3: Layout + Polish
- **Dni 1-2:** Header, sidebar, footer, responsive layout
- **Dni 3-4:** Testing, bug fixes, UI polish
- **Dzień 5:** Documentation, staging deployment, review

---

## 12. Historia Zmian

| Data | Wersja | Autor | Zmiany |
|------|--------|-------|--------|
| 2025-11-28 | 1.0 | AI Stage Planner | Initial specification |

---

**Przygotował:** AI Project Planner (Stage Planner Agent)
**Data:** 2025-11-28
**Status:** ✅ Ready for Export to AI Spec Flow
