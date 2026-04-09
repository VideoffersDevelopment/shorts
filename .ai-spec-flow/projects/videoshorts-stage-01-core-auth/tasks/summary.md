# Tasks Summary: Core + Auth (Stage 1)

**Project:** videoshorts-stage-01-core-auth
**Type:** GREENFIELD
**Total Tasks:** 8
**Execution Order:** Sequential (01→02) then Parallel (03-06) then Final (07) then Enhancement (08)

---

## Quick Reference

| Task | Name | Files | Complexity | Dependencies | Status |
|------|------|-------|------------|--------------|--------|
| 01 | Project Setup | 8 | Simple (~8k tokens) | None | ✅ |
| 02 | Core Infrastructure | 12 | Medium (~12k tokens) | task-01 | ✅ |
| 03 | Authentication Flow | 18 | Medium (~18k tokens) | task-02 | ✅ |
| 04 | Profile Management | 14 | Medium (~14k tokens) | task-02 | ✅ |
| 05 | Settings & Account | 10 | Simple (~10k tokens) | task-02 | ✅ |
| 06 | Theme & Preferences | 9 | Simple (~9k tokens) | task-02 | ✅ |
| 07 | Layout & Navigation | 16 | Medium (~16k tokens) | task-03, task-04, task-05, task-06 | ✅ |
| 08 | Avatar Enhancements | 11 | Medium (~11k tokens) | task-04, task-07 | ⏳ |

**Total:** ~98 files, ~108k tokens

---

## Execution Strategy

### Phase 1: Foundation (Sequential)
```
Task 01 (Setup) → Task 02 (Infrastructure)
```
**BLOCKING:** Tasks 03-07 cannot start until Task 02 completes.

### Phase 2: Features (Parallel)
```
Task 03 (Auth) ┐
Task 04 (Profile) ├─→ All can run in parallel
Task 05 (Settings) │
Task 06 (Theme) ┘
```
**PARALLEL:** These tasks are independent after Task 02.

### Phase 3: Integration (Sequential)
```
Task 07 (Layout) ← Integrates all previous tasks
```
**FINAL:** Must be executed last.

### Phase 4: Enhancements (Sequential)
```
Task 08 (Avatar Enhancements) ← Adds cropping + deletion to Task 04
```
**ENHANCEMENT:** Builds on completed Task 04 + 07.

---

## Key Deliverables by Task

### Task 01: Project Setup
- Next.js 14+ project initialized
- TypeScript + Tailwind configured
- 25+ dependencies installed
- Environment variables template

### Task 02: Core Infrastructure
- Prisma schema (5 models)
- NextAuth v5 configured
- R2 + Resend clients
- Zod validation schemas
- Middleware (i18n + auth)

### Task 03: Authentication Flow
- 5 auth pages (login, signup, verify, forgot, reset)
- 5 React components
- 4 server actions
- 3 email templates
- 10 translation files (auth.json, common.json for 5 languages)

### Task 04: Profile Management
- Profile page + form
- Avatar upload (R2 presigned URLs)
- 1 server action
- 1 API route
- 5 translation files (profile.json)

### Task 05: Settings & Account
- Settings page
- Password change form
- Account deletion dialog
- 2 server actions
- 5 translation files (settings.json)

### Task 06: Theme & Preferences
- Dark mode toggle (next-themes)
- Language switcher (5 languages)
- Theme provider
- 5 translation files (preferences.json)

### Task 07: Layout & Navigation
- Dashboard page
- Sidebar navigation
- Header with user menu
- Mobile drawer
- Footer
- 5 translation files (sidebar.json)

### Task 08: Avatar Enhancements
- Image cropping modal (react-image-crop)
- Delete avatar functionality
- R2 cleanup (old files)
- 1 server action (deleteAvatarAction)
- 1 API DELETE endpoint
- 5 translation file updates (profile.json)

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 14+, React 19, TypeScript 5.3+, Tailwind |
| UI | shadcn/ui, next-themes, next-intl, Lucide icons |
| Backend | Next.js Server Actions, NextAuth.js v5, Prisma |
| Database | Neon DB (PostgreSQL 15+) |
| Storage | Cloudflare R2 |
| Email | Resend + React Email |

---

## Database Models

1. **User** - Core auth (email, passwordHash, role, emailVerified)
2. **Account** - OAuth connections
3. **Session** - Active sessions
4. **VerificationToken** - Email/password tokens
5. **UserProfile** - Extended profile (avatar, bio, darkMode)

---

## Server Actions

1. `signupAction` - User registration
2. `verifyEmailAction` - Email verification
3. `forgotPasswordAction` - Send reset email
4. `resetPasswordAction` - Password reset
5. `updateProfileAction` - Update profile
6. `changePasswordAction` - Change password
7. `deleteAccountAction` - Soft delete account
8. `deleteAvatarAction` - Delete avatar from R2 + DB

---

## Translation Files (35 total)

**5 languages:** pl, en, de, es, ru

**6 namespaces:**
- auth.json (login, signup, verification)
- profile.json (profile editing + avatar enhancements)
- settings.json (account settings)
- preferences.json (theme, language)
- common.json (buttons, errors)
- sidebar.json (navigation)

---

## External Services

1. **Neon DB** - PostgreSQL database
2. **NextAuth** - Authentication
3. **Resend** - Transactional email
4. **Cloudflare R2** - File storage
5. **Google OAuth** - Social login
6. **Facebook OAuth** - Social login

---

## Environment Variables Required

```env
DATABASE_URL=""
NEXTAUTH_URL=""
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
R2_ENDPOINT=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
RESEND_API_KEY=""
NEXT_PUBLIC_APP_URL=""
```

---

## Success Criteria

**Per Task:**
- [ ] All files created/modified as specified
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors

**Full Project:**
- [ ] All 8 tasks completed
- [ ] Full auth flow works (signup → verify → login)
- [ ] Profile management works (edit + avatar upload with cropping)
- [ ] Avatar deletion works (R2 cleanup + DB update)
- [ ] Settings work (password change, account deletion)
- [ ] Theme toggle works (light/dark)
- [ ] All 5 languages load correctly
- [ ] Navigation works (sidebar + mobile)

---

## Testing Strategy

1. **Manual Testing** - Use Chrome DevTools MCP for visual verification
2. **Test User** - Create test user with .env.local credentials
3. **User Flows** - Test full authentication + profile flows
4. **Responsive** - Test mobile/tablet/desktop layouts
5. **i18n** - Test all 5 language translations

---

## Coder Instructions

1. **Read task specs** from `tasks/task-XX/spec.md`
2. **Follow execution order** (01→02→[03-06]→07)
3. **Check dependencies** before starting each task
4. **Validate** with `npm run build` after each task
5. **Use specifications** exactly as written (file paths, imports, etc.)
6. **Don't skip steps** (migrations, code generation, etc.)
7. **Test locally** before marking complete
