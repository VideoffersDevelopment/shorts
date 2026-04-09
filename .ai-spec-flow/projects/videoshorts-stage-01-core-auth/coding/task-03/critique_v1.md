# Code Review: Task-03 Authentication Flow - Iteration 1/3

**Commit:** 4850b823be9cd313c7ea21aa84b0282958d95abb
**Reviewer:** Coder-Critic Agent
**Date:** 2025-11-28

---

## Verdict: ❌ CHANGES REQUIRED

---

## Step 0: Acceptance Criteria Verification

### Task Spec Requirements Check

| #   | Criterion               | Status  | Evidence                                                                                                  |
| --- | ----------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Email Templates Created | ❌ FAIL | Missing: `src/emails/verify-email.tsx`, `src/emails/password-reset.tsx`, `src/emails/welcome.tsx`         |
| 2   | 5 Auth Pages            | ✅ PASS | All pages present: login, signup, verify-email, forgot-password, reset-password                           |
| 3   | 5 Auth Components       | ✅ PASS | All components present: login-form, signup-form, oauth-buttons, forgot-password-form, reset-password-form |
| 4   | 4 Server Actions        | ✅ PASS | All actions present: signup, verify-email, forgot-password, reset-password                                |
| 5   | 10 Translation Files    | ✅ PASS | All 5x2 translation files present (auth.json + common.json for pl/en/de/es/ru)                            |
| 6   | i18n Infrastructure     | ✅ PASS | Created: config.ts, client.ts, server.ts, request.ts, i18n.ts                                             |
| 7   | UI Components           | ✅ PASS | Created: button, input, label, card, alert                                                                |
| 8   | Auth Layout             | ✅ PASS | Layout created with NextIntlClientProvider                                                                |
| 9   | Build Passes            | ✅ PASS | `npm run build` successful ✓                                                                              |
| 10  | No TypeScript Errors    | ✅ PASS | `npx tsc --noEmit` passes ✓                                                                               |

**Acceptance Criteria Result:** ❌ FAIL (9/10 criteria met)

**Missing Items:**

- 3 Email Template files (spec explicitly requires React components in `src/emails/`)

---

## Code Quality Review

### ✅ Type Safety - PASS

**No `any` types found.** All code uses proper TypeScript types:

- Server actions use explicit interfaces (`SignupResult`, `VerifyEmailResult`, etc.)
- Forms use Zod-inferred types (`LoginInput`, `SignupInput`, `ResetPasswordInput`)
- Component props properly typed (`ResetPasswordFormProps`, `ButtonProps`, etc.)
- i18n utilities properly typed (`Locale` type from config)

**Examples:**

```typescript
// ✅ Proper typing
interface SignupResult {
	success?: boolean;
	error?: string;
}

export type LoginInput = z.infer<typeof loginSchema>;
```

---

### ✅ React Patterns - PASS

#### Hook Dependencies

All `useCallback` hooks have **complete dependency arrays**:

**Login Form:**

```typescript
const onSubmit = useCallback(
	async (data: LoginInput) => {
		// ...
	},
	[router, t]
); // ✅ Both dependencies included
```

**Signup Form:**

```typescript
const onSubmit = useCallback(
	async (data: SignupInput) => {
		// ...
	},
	[form]
); // ✅ Complete
```

**OAuth Buttons:**

```typescript
const handleGoogleSignIn = useCallback(() => {
	signIn("google", { callbackUrl: "/panel" });
}, []); // ✅ No external dependencies
```

**Verify Email Page:**

```typescript
useEffect(() => {
	const token = searchParams.get("token");
	// ...
}, [searchParams]); // ✅ Complete
```

---

### ✅ i18n Implementation - PASS

**All client components use `@/lib/i18n/client` (NOT `next-intl` directly):**

```typescript
// ✅ CORRECT - All components follow this pattern
import { useTranslations } from '@/lib/i18n/client'

export function LoginForm() {
  const { t } = useTranslations('auth') // ✅ Destructured
  return <button>{t('login.submit')}</button>
}
```

**Server components use `next-intl/server`:**

```typescript
// ✅ CORRECT
import { getTranslations } from 'next-intl/server'

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return <h1>{t('login.title')}</h1>
}
```

**Translation namespace matches file structure:**

- All components use `'auth'` namespace ✅
- Translation keys properly nested (e.g., `login.title`, `signup.email`) ✅

---

### ✅ Server Actions Security - PASS

All server actions follow the **4-step pattern**:

**1. Validate Input (Zod)**

```typescript
const parsed = signupSchema.safeParse(data);
if (!parsed.success) {
	return { error: parsed.error.errors[0].message };
}
```

**2. Check Existing Records**

```typescript
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
	return { error: "Email already registered" };
}
```

**3. Database Operation**

```typescript
await prisma.user.create({
	data: {
		email,
		passwordHash,
		role: "USER",
	},
});
```

**4. Side Effects (Email)**

```typescript
await sendEmail({
	to: email,
	subject: "Verify your email",
	html: generateVerificationEmail(token),
});
```

**No security vulnerabilities:**

- Input validation via Zod schemas ✅
- Password hashing via bcrypt ✅
- Token generation via crypto.getRandomValues ✅
- No SQL injection risk (Prisma) ✅

---

### ⚠️ Missing Files - FAIL

**Email Templates Required by Spec:**

The task spec explicitly requires 3 React email template files:

| File                            | Status     | Notes                                      |
| ------------------------------- | ---------- | ------------------------------------------ |
| `src/emails/verify-email.tsx`   | ❌ MISSING | Currently using inline HTML in `resend.ts` |
| `src/emails/password-reset.tsx` | ❌ MISSING | Currently using inline HTML in `resend.ts` |
| `src/emails/welcome.tsx`        | ❌ MISSING | Not implemented at all                     |

**Current Implementation:**
Email generation is done via inline HTML functions in `src/lib/resend.ts`:

```typescript
export function generateVerificationEmail(
	token: string,
	locale: string = "pl"
): string {
	return `<!DOCTYPE html>...`; // Inline HTML string
}
```

**Required Implementation:**
Must create React components using `react-email` package (as per spec line 265: "Email templates use `react-email` for HTML rendering"):

```typescript
// src/emails/verify-email.tsx
import { Html, Button, Container, Heading, Text } from '@react-email/components'

interface VerifyEmailProps {
  token: string
  locale?: string
}

export default function VerifyEmail({ token, locale = 'pl' }: VerifyEmailProps) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-email?token=${token}`

  return (
    <Html>
      <Container>
        <Heading>Welcome to VideoShorts!</Heading>
        <Text>Please verify your email address:</Text>
        <Button href={verifyUrl}>Verify Email</Button>
      </Container>
    </Html>
  )
}
```

---

### ✅ Build & TypeScript - PASS

```bash
✓ npm run build - Successful
✓ npx tsc --noEmit - No errors
✓ All pages compiled correctly
```

**Build Output:**

```
Route (app)                                 Size  First Load JS
├ ƒ /[locale]/forgot-password             2.3 kB         149 kB
├ ƒ /[locale]/login                      3.08 kB         152 kB
├ ƒ /[locale]/reset-password             2.63 kB         149 kB
├ ƒ /[locale]/signup                      3.2 kB         152 kB
├ ƒ /[locale]/verify-email               1.89 kB         127 kB
```

---

## Summary

### What Works ✅

1. **Type Safety**: No `any` types, all proper interfaces
2. **React Patterns**: Complete hook dependencies, proper component structure
3. **i18n**: Correct usage of `@/lib/i18n/client` in client components
4. **Security**: Server actions follow validation → check → operate pattern
5. **Translations**: All 10 files present (5 languages × 2 namespaces)
6. **Build**: Passes successfully with no TypeScript errors
7. **Component Structure**: All 5 auth components, 5 pages, 4 server actions created

### What's Missing ❌

1. **Email Templates**: 3 React component files required by spec
   - `src/emails/verify-email.tsx`
   - `src/emails/password-reset.tsx`
   - `src/emails/welcome.tsx`

---

## Required Changes

### 1. Create Email Template Components

**Install react-email:**

```bash
npm install @react-email/components
```

**Create `src/emails/verify-email.tsx`:**

```typescript
import { Html, Button, Container, Heading, Text, Section } from '@react-email/components'

interface VerifyEmailProps {
  token: string
  locale?: string
}

export default function VerifyEmail({ token, locale = 'pl' }: VerifyEmailProps) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-email?token=${token}`

  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Heading>Welcome to VideoShorts!</Heading>
        <Text>Please verify your email address by clicking the button below:</Text>
        <Section style={{ marginTop: '20px' }}>
          <Button
            href={verifyUrl}
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            Verify Email
          </Button>
        </Section>
        <Text style={{ marginTop: '20px', color: '#666' }}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Html>
  )
}
```

**Create `src/emails/password-reset.tsx`:**

```typescript
import { Html, Button, Container, Heading, Text, Section } from '@react-email/components'

interface PasswordResetProps {
  token: string
  locale?: string
}

export default function PasswordReset({ token, locale = 'pl' }: PasswordResetProps) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/reset-password?token=${token}`

  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Heading>Password Reset Request</Heading>
        <Text>Click the button below to reset your password:</Text>
        <Section style={{ marginTop: '20px' }}>
          <Button
            href={resetUrl}
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            Reset Password
          </Button>
        </Section>
        <Text style={{ marginTop: '20px', color: '#666' }}>
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </Text>
      </Container>
    </Html>
  )
}
```

**Create `src/emails/welcome.tsx`:**

```typescript
import { Html, Container, Heading, Text } from '@react-email/components'

interface WelcomeProps {
  email: string
  locale?: string
}

export default function Welcome({ email, locale = 'pl' }: WelcomeProps) {
  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Heading>Welcome to VideoShorts!</Heading>
        <Text>Your email {email} has been verified successfully.</Text>
        <Text>You can now start creating and sharing short videos.</Text>
      </Container>
    </Html>
  )
}
```

### 2. Update `src/lib/resend.ts` to Use React Components

Replace inline HTML generators with React component rendering:

```typescript
import { Resend } from 'resend'
import { render } from '@react-email/components'
import VerifyEmail from '@/emails/verify-email'
import PasswordReset from '@/emails/password-reset'
import Welcome from '@/emails/welcome'

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'VideoShorts <noreply@videoffers.com>'
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }

  return data
}

export function generateVerificationEmail(token: string, locale: string = 'pl'): string {
  return render(<VerifyEmail token={token} locale={locale} />)
}

export function generatePasswordResetEmail(token: string, locale: string = 'pl'): string {
  return render(<PasswordReset token={token} locale={locale} />)
}

export function generateWelcomeEmail(email: string, locale: string = 'pl'): string {
  return render(<Welcome email={email} locale={locale} />)
}
```

### 3. Update Server Actions (Optional Enhancement)

Consider sending welcome email after successful email verification in `verify-email.ts`:

```typescript
import { generateWelcomeEmail, sendEmail } from "@/lib/resend";

export async function verifyEmailAction(
	token: string
): Promise<VerifyEmailResult> {
	// ... existing code ...

	await prisma.user.update({
		where: { email: verification.identifier },
		data: { emailVerified: new Date() },
	});

	await prisma.verificationToken.delete({ where: { token } });

	// Send welcome email
	await sendEmail({
		to: verification.identifier,
		subject: "Welcome to VideoShorts!",
		html: generateWelcomeEmail(verification.identifier),
	});

	return { success: true };
}
```

---

## Iteration Summary

**Code Quality:** Excellent ✅
**Completeness:** 9/10 files (missing email templates)
**Next Steps:** Create 3 email template components + update resend.ts

**Estimated Time to Fix:** 15 minutes

---

**After implementing the required changes:**

- Run `npm run build` to verify
- Commit changes with message: "feat(task-03): add React email templates - iteration v2"
- Request re-review from coder-critic

---

**Generated by:** Coder-Critic Agent
**Co-Authored-By:** Claude <noreply@anthropic.com>
