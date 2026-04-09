# Components Documentation

React component documentation with usage examples and API references.

---

## Component Categories

### [Profile Components](./profile/README.md)
User profile management components including avatar upload and profile forms.

**Components:**
- [AvatarUpload](./profile/avatar-upload.md) - Avatar upload with cropping and deletion
- [ProfileForm](./profile/profile-form.md) - Profile editing form

---

## Component Index

| Component       | Category | Purpose                           | File                                     |
|-----------------|----------|-----------------------------------|------------------------------------------|
| AvatarUpload    | Profile  | Avatar upload with cropping       | src/components/profile/avatar-upload.tsx |
| ProfileForm     | Profile  | Profile editing form              | src/components/profile/profile-form.tsx  |

---

## Component Standards

All components in this project follow these standards:

### TypeScript
- Strict type checking enabled
- Props interfaces explicitly defined
- No implicit any types

### Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly

### Internationalization
- All user-facing text uses i18n translations
- `useTranslations` hook from next-intl
- Support for 5 languages (pl, en, de, es, ru)

### Testing
- Comprehensive test suites with React Testing Library
- Rendering tests for all variants
- User interaction tests
- Accessibility tests
- Edge case coverage

### Styling
- Tailwind CSS utility classes
- shadcn/ui component library
- Dark mode support with `dark:` variants
- Responsive design (mobile-first)

---

**Last Updated:** 2025-11-29
