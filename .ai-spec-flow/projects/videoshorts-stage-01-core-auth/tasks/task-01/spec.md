# Task 01: Project Setup

## Overview

**Priority:** HIGH
**Dependencies:** None
**Complexity:** Simple (8 files, ~8k tokens)
**Status:** pending

## What to Build

Initialize Next.js 14+ project with TypeScript, install all dependencies, configure Tailwind CSS, setup environment variables, and configure project settings. This is the foundation for all subsequent tasks.

## Files to Create

| File                 | Type   | Description                      |
| -------------------- | ------ | -------------------------------- |
| `package.json`       | Create | Next.js dependencies and scripts |
| `tsconfig.json`      | Create | TypeScript configuration         |
| `next.config.js`     | Create | Next.js config with i18n         |
| `tailwind.config.ts` | Create | Tailwind CSS configuration       |
| `postcss.config.js`  | Create | PostCSS configuration            |
| `.env.example`       | Create | Example environment variables    |
| `.gitignore`         | Create | Git ignore patterns              |
| `src/app/layout.tsx` | Create | Root layout                      |

## Acceptance Criteria

- [ ] Next.js 14+ project initialized with App Router
- [ ] TypeScript 5.3+ configured
- [ ] Tailwind CSS v3+ configured with custom theme
- [ ] All dependencies installed (see list below)
- [ ] `.env.example` created with all required variables
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Dependencies to Install

```json
{
	"dependencies": {
		"next": "^14.0.0",
		"react": "^19.0.0",
		"react-dom": "^19.0.0",
		"next-auth": "^5.0.0-beta.4",
		"@auth/prisma-adapter": "^1.0.0",
		"@prisma/client": "^5.8.0",
		"@aws-sdk/client-s3": "^3.478.0",
		"@aws-sdk/s3-request-presigner": "^3.478.0",
		"resend": "^3.0.0",
		"react-email": "^2.0.0",
		"react-hook-form": "^7.49.0",
		"@hookform/resolvers": "^3.3.4",
		"zod": "^3.22.4",
		"next-themes": "^0.2.1",
		"next-intl": "^3.4.0",
		"bcryptjs": "^2.4.3",
		"lucide-react": "^0.303.0",
		"class-variance-authority": "^0.7.0",
		"clsx": "^2.1.0",
		"tailwind-merge": "^2.2.0",
		"date-fns": "^3.0.0"
	},
	"devDependencies": {
		"@types/node": "^20.10.0",
		"@types/react": "^18.2.0",
		"@types/react-dom": "^18.2.0",
		"@types/bcryptjs": "^2.4.6",
		"typescript": "^5.3.0",
		"tailwindcss": "^3.4.0",
		"postcss": "^8.4.32",
		"autoprefixer": "^10.4.16",
		"prisma": "^5.8.0",
		"eslint": "^8.56.0",
		"eslint-config-next": "^14.0.0"
	}
}
```

## Configuration Files

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname:
					process.env.R2_PUBLIC_URL?.replace("https://", "") ||
					"cdn.videoffers.com",
			},
		],
	},
};

module.exports = nextConfig;
```

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [],
};

export default config;
```

### .env.example

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/videoshorts?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-with-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Cloudflare R2 Storage
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="videoshorts"
R2_PUBLIC_URL="https://cdn.videoffers.com"

# Resend Email
RESEND_API_KEY="re_your_api_key"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Visual Verification Steps

### Prerequisites

- Node.js 18+ installed
- npm or yarn available
- Terminal access

### Steps

| Step | Action                 | Expected Result            | Command/Verification                                                               |
| ---- | ---------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| 1    | Create Next.js project | Project initialized        | `npx create-next-app@latest shorts --typescript --tailwind --app --src-dir`        |
| 2    | Install dependencies   | No errors                  | `npm install` completes successfully                                               |
| 3    | Start dev server       | Server starts on port 3000 | `npm run dev` shows "Ready" message                                                |
| 4    | Open browser           | Default Next.js page loads | Navigate to `http://localhost:3000`                                                |
| 5    | Run build              | Build completes            | `npm run build` exits with code 0                                                  |
| 6    | Check TypeScript       | No type errors             | `npx tsc --noEmit` exits with code 0                                               |
| 7    | Check files            | All config files exist     | Verify `package.json`, `tsconfig.json`, `tailwind.config.ts`, `.env.example` exist |

### Verification Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# TypeScript check
npx tsc --noEmit

# List files
ls -la
```

## Notes

1. Use `create-next-app` to initialize: `npx create-next-app@latest shorts --typescript --tailwind --app --src-dir`
2. After init, install additional dependencies: `npm install <packages>`
3. Create `.env.local` from `.env.example` and fill in actual values
4. Do NOT commit `.env.local` to git
5. Ensure Node.js 18+ is installed
6. Ensure PostgreSQL connection string is ready (Neon DB recommended)
