# Task 10: Fix Test Environment Issue

## Overview
**Priority:** HIGH
**Dependencies:** None (standalone fix)
**Complexity:** Simple (3 files, ~3k tokens)
**Status:** pending

## Problem Description

3 test suites are failing due to Next.js module resolution issue in Vitest:

**Error:** `Cannot find module 'a:\wamp64\www\shorts\node_modules\next\server'`

**Affected Files:**
1. `src/app/actions/admin/categories/__tests__/create.test.ts`
2. `src/app/actions/admin/categories/__tests__/delete.test.ts`
3. `src/app/actions/admin/categories/__tests__/update.test.ts`

**Root Cause:** The admin categories server actions import from `next-auth` which internally imports `next/server`. Vitest doesn't properly resolve Next.js server modules.

## What to Build

### 1. Update Vitest Configuration

Update `vitest.config.ts` to properly resolve Next.js server modules:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add Next.js server module mock
      'next/server': path.resolve(__dirname, './src/test/mocks/next-server.ts'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2. Create Next.js Server Mock

Create `src/test/mocks/next-server.ts`:

```typescript
// Mock for next/server modules used by next-auth
export class NextRequest extends Request {
  nextUrl: URL
  cookies: Map<string, string>

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)
    this.nextUrl = new URL(typeof input === 'string' ? input : input.toString())
    this.cookies = new Map()
  }
}

export class NextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    })
  }

  static redirect(url: string | URL, status = 307) {
    return new Response(null, {
      status,
      headers: { Location: url.toString() },
    })
  }
}

export const cookies = () => ({
  get: () => undefined,
  set: () => {},
  delete: () => {},
  has: () => false,
  getAll: () => [],
})

export const headers = () => new Headers()
```

### 3. Verify Tests Pass

After fix, run:
```bash
npm run test:run -- --reporter=verbose
```

Expected: All 53 test suites pass (100%)

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/test/mocks/next-server.ts` | Create | Mock for next/server module |

## Files to Modify

| File | Changes |
|------|---------|
| `vitest.config.ts` | Add alias for next/server mock |

## Acceptance Criteria

- [ ] `npm run test:run` passes all 53 test suites (100%)
- [ ] No "Cannot find module 'next/server'" errors
- [ ] All 1217 tests pass (currently 1204 + 13 skipped)
- [ ] `npm run build` still passes
- [ ] No TypeScript errors

## Visual Verification Steps

Not applicable - this is a configuration/testing task.

### Terminal Verification

| Step | Command | Expected Result |
|------|---------|-----------------|
| 1 | `npm run test:run` | 53/53 test suites pass |
| 2 | `npm run build` | Build succeeds |
| 3 | `npm run type-check` | No type errors |

## Notes

- This is a dev-only fix (doesn't affect production code)
- The mock only needs to satisfy next-auth's minimal usage of next/server
- If the mock needs more methods, add them incrementally based on test errors
- Alternative approach: use `vi.mock('next/server')` in individual test files, but global alias is cleaner

## References

- [Vitest Alias Documentation](https://vitest.dev/config/#alias)
- [Next.js Server Components Testing](https://nextjs.org/docs/app/building-your-application/testing)
- Related issue: 3 failing test suites in admin/categories
