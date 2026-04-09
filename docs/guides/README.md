# Developer Guides

Guides and best practices for working with the VideoShorts codebase.

---

## Available Guides

### [Getting Started](./getting-started.md)
Quick start guide for setting up the development environment.

### [Testing Guide](./testing.md)
Comprehensive testing guide including patterns and best practices.

---

## Quick References

### Project Structure

```
shorts/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/            # Server Actions
│   │   ├── api/                # API Routes
│   │   └── [locale]/           # Internationalized pages
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── shared/             # Shared components
│   │   └── [feature]/          # Feature-specific components
│   └── lib/                    # Utilities and configurations
│       ├── auth.ts             # NextAuth configuration
│       ├── prisma.ts           # Prisma client
│       ├── r2.ts               # Cloudflare R2 utilities
│       └── i18n/               # Internationalization
├── prisma/
│   └── schema.prisma           # Database schema
├── docs/                       # Auto-generated documentation
└── tests/                      # Test files
```

### Common Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run start                   # Start production server

# Testing
npm run test                    # Run tests (watch mode)
npm run test:run                # Run tests (single run)
npm run test:coverage           # Generate coverage report

# Database
npx prisma generate             # Generate Prisma Client
npx prisma migrate dev          # Create and apply migration
npx prisma studio               # Open Prisma Studio

# Code Quality
npm run lint                    # Run ESLint
npm run type-check              # Run TypeScript compiler
```

---

## Coding Standards

### TypeScript

- Strict mode enabled
- No implicit any
- Explicit function return types for public APIs
- Use type inference for local variables

### React

- Functional components only
- Custom hooks for reusable logic
- Props interfaces explicitly defined
- Use React 19 features (useActionState, etc.)

### Styling

- Tailwind CSS utility-first approach
- shadcn/ui for base components
- Dark mode with `dark:` variants
- Mobile-first responsive design

### i18n

- All user-facing text must be translated
- Use `useTranslations` hook
- Namespace by feature (auth, profile, etc.)
- Support 5 languages: pl, en, de, es, ru

---

**Last Updated:** 2025-11-29
