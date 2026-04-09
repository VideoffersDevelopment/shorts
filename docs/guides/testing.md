# Testing Guide

Comprehensive testing guide for the VideoShorts project.

**Framework:** Vitest
**Testing Library:** React Testing Library
**User Events:** @testing-library/user-event

---

## Overview

This project uses a comprehensive testing strategy covering:

- Server Actions (business logic)
- React Components (UI and interactions)
- Utilities (helper functions)
- API Routes (endpoints)

**Current Statistics:**
- Total Tests: 530
- Passing: 517
- Skipped: 13
- Coverage: 80%+

---

## Test Structure

### File Organization

```
src/
├── app/
│   └── actions/
│       └── profile/
│           ├── delete-avatar.ts
│           └── __tests__/
│               └── delete-avatar.test.ts
├── components/
│   └── profile/
│       ├── avatar-upload.tsx
│       └── avatar-upload.test.tsx
└── lib/
    ├── r2.ts
    └── __tests__/
        └── r2.test.ts
```

### Naming Convention

- **Server Actions:** `src/app/actions/[domain]/__tests__/[action].test.ts`
- **Components:** `src/components/[category]/[component].test.tsx`
- **Utilities:** `src/lib/__tests__/[utility].test.ts`

---

## Writing Tests

### Component Tests

**Example: AvatarUpload Component**

```typescript
import { render, screen } from '@/test/utils'
import { AvatarUpload } from './avatar-upload'
import { userEvent } from '@testing-library/user-event'

describe('AvatarUpload', () => {
  // 1. RENDERING TESTS
  it('renders avatar with initials when no avatar provided', () => {
    render(
      <AvatarUpload
        currentAvatar={null}
        userEmail="test@example.com"
        onAvatarChange={vi.fn()}
      />
    )

    expect(screen.getByText('TE')).toBeInTheDocument()
  })

  // 2. INTERACTION TESTS
  it('opens file picker when clicking change button', async () => {
    const user = userEvent.setup()

    render(
      <AvatarUpload
        currentAvatar={null}
        userEmail="test@example.com"
        onAvatarChange={vi.fn()}
      />
    )

    const input = screen.getByLabelText(/change picture/i)
    await user.click(screen.getByRole('button', { name: /change picture/i }))

    expect(input).toBeInTheDocument()
  })

  // 3. STATE TESTS
  it('shows loading state during upload', async () => {
    render(
      <AvatarUpload
        currentAvatar={null}
        userEmail="test@example.com"
        onAvatarChange={vi.fn()}
      />
    )

    // Trigger upload
    // ...

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  // 4. ACCESSIBILITY TESTS
  it('has accessible buttons', () => {
    render(
      <AvatarUpload
        currentAvatar="https://example.com/avatar.jpg"
        userEmail="test@example.com"
        onAvatarChange={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /change picture/i }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove avatar/i }))
      .toBeInTheDocument()
  })
})
```

### Server Action Tests

**Example: deleteAvatarAction**

```typescript
import { deleteAvatarAction } from '../delete-avatar'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/r2'

vi.mock('@/lib/auth')
vi.mock('@/lib/prisma')
vi.mock('@/lib/r2')
vi.mock('next/cache')

describe('deleteAvatarAction', () => {
  // 1. HAPPY PATH
  it('deletes avatar successfully when avatar exists', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' }
    })

    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
      avatar: 'https://cdn.example.com/avatars/user-123/avatar.jpg'
    })

    const result = await deleteAvatarAction()

    expect(result).toEqual({ success: true })
    expect(deleteObject).toHaveBeenCalledWith('avatars/user-123/avatar.jpg')
    expect(prisma.userProfile.update).toHaveBeenCalled()
  })

  // 2. AUTHENTICATION FAILURES
  it('returns error when user not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const result = await deleteAvatarAction()

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(deleteObject).not.toHaveBeenCalled()
  })

  // 3. ERROR HANDLING
  it('handles R2 deletion errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' }
    })

    vi.mocked(deleteObject).mockRejectedValue(
      new Error('R2 error')
    )

    const result = await deleteAvatarAction()

    expect(result).toEqual({ error: 'Failed to delete avatar' })
  })
})
```

---

## Test Categories

### 1. Rendering Tests

Test component rendering with different props:

```typescript
it('renders with null avatar', () => {
  render(<Component currentAvatar={null} />)
  expect(screen.getByText('Initials')).toBeInTheDocument()
})

it('renders with avatar URL', () => {
  render(<Component currentAvatar="https://..." />)
  expect(screen.getByRole('img')).toHaveAttribute('src', 'https://...')
})
```

### 2. Interaction Tests

Test user interactions:

```typescript
it('handles button click', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()

  render(<Button onClick={onClick}>Click me</Button>)

  await user.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalled()
})
```

### 3. State Tests

Test component state changes:

```typescript
it('shows loading state', async () => {
  render(<Component />)

  // Trigger async action
  await user.click(screen.getByRole('button'))

  expect(screen.getByText('Loading...')).toBeInTheDocument()
})
```

### 4. Error Handling Tests

Test error states:

```typescript
it('displays error message on failure', async () => {
  vi.mocked(apiCall).mockRejectedValue(new Error('API error'))

  render(<Component />)

  await user.click(screen.getByRole('button'))

  expect(screen.getByText('Failed to upload')).toBeInTheDocument()
})
```

### 5. Accessibility Tests

Test accessibility features:

```typescript
it('has accessible labels', () => {
  render(<Component />)

  expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /submit/i }))
    .toBeInTheDocument()
})
```

---

## Best Practices

### Do's

- **Test behavior, not implementation**
- **Use semantic queries** (getByRole, getByLabelText)
- **Test from user perspective**
- **Mock external dependencies**
- **Test edge cases and errors**
- **Write descriptive test names**

### Don'ts

- **Don't test implementation details**
- **Don't use getByTestId** (except as last resort)
- **Don't duplicate tests**
- **Don't test library code**
- **Don't skip cleanup**

---

## Common Patterns

### Mocking Server Actions

```typescript
vi.mock('@/app/actions/profile/delete-avatar', () => ({
  deleteAvatarAction: vi.fn()
}))

// In test
vi.mocked(deleteAvatarAction).mockResolvedValue({ success: true })
```

### Mocking Prisma

```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    userProfile: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))
```

### Mocking File Input

```typescript
const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

const input = screen.getByLabelText(/change picture/i)
await user.upload(input, file)
```

### Testing Async Operations

```typescript
it('handles async operation', async () => {
  render(<Component />)

  await user.click(screen.getByRole('button'))

  // Wait for async completion
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

---

## Known Limitations

### jsdom Canvas/Blob

jsdom doesn't fully support Canvas and Blob APIs.

**Affected Tests:**
- Avatar cropping (canvas to blob conversion)
- Direct R2 upload simulation
- Image manipulation

**Workaround:**
- Skip tests with `.skip()` or conditional execution
- Mock canvas/blob operations
- Test integration separately in E2E tests

**Example:**
```typescript
it.skip('uploads cropped avatar', async () => {
  // Skipped: jsdom doesn't support canvas.toBlob()
})
```

---

## Coverage

### Current Coverage

- **Overall:** 80%+
- **Components:** 85%+
- **Server Actions:** 90%+
- **Utilities:** 75%+

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Goals

- **Critical paths:** 100% (auth, payments)
- **UI components:** 80%+
- **Utilities:** 75%+
- **Overall:** 80%+

---

## Running Tests

### Watch Mode (Development)

```bash
npm run test
```

Watches files and re-runs tests on changes.

### Single Run (CI)

```bash
npm run test:run
```

Runs all tests once and exits.

### Coverage

```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

### Specific File

```bash
npm run test src/components/profile/avatar-upload.test.tsx
```

### Filter by Name

```bash
npm run test -- -t "deletes avatar"
```

---

## CI/CD Integration

Tests run automatically on:

- Every commit (pre-commit hook)
- Every pull request (GitHub Actions)
- Before deployment (production)

**Required Passing:**
- All tests must pass
- No TypeScript errors
- Build succeeds

---

## Related Documentation

- [Component Documentation](../components/README.md)
- [API Documentation](../api/README.md)
- [Getting Started](./getting-started.md)

---

**Last Updated:** 2025-11-29
**Total Tests:** 530
**Coverage:** 80%+
