# Nutri B2C Frontend

Consumer nutrition web app built with Next.js 15, focused on recipe discovery, analysis, meal planning, and daily nutrition tracking.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your actual Appwrite credentials

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

## Environment Setup

Use `.env.example` as the template. Copy to `.env.local` — **never commit real secrets**.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL (e.g. `http://localhost:3000`) |
| `API_BASE_URL` | ✅ | Backend proxy target (Docker: `http://backend:5000`, Local: `http://localhost:5000`) |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | ✅ | Appwrite cloud/self-hosted endpoint |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | ✅ | Appwrite project ID |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | ✅ | Appwrite database ID (`nutrition_db`) |
| `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` | ✅ | Profiles collection ID |
| `NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID` | ✅ | Health profiles collection ID |
| `NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID` | Optional | Admin team ID for admin features |
| `NEXT_PUBLIC_API_BASE_URL` | Optional | Direct browser→API URL (bypasses Next rewrites) |

## Docker

The frontend is part of the root `docker-compose.yml` stack. Uses Next.js standalone output for minimal image size (~200MB).

```bash
# From project root (B2C/)
docker compose up -d --build frontend
```

> **Note:** `NEXT_PUBLIC_*` vars must be provided at **build time** (via Docker build args). They are baked into the client bundle. `API_BASE_URL` is read at runtime for server-side rewrites.

## Main Routes

| Route | Description |
|-------|-------------|
| `/` | Home — discovery feed |
| `/recipes` | Recipe browsing and detail |
| `/recipe-analyzer` | Multi-source analyzer (text/URL/image/barcode) |
| `/scan` | Product barcode/image scan |
| `/meal-log` | Daily nutrition logging |
| `/meal-plan` | Weekly plan generation and management |
| `/grocery-list` | Shopping list management |
| `/budget` | Household budget tracking |
| `/profile` | Profile and health preferences |
| `/settings` | App settings and customization |

## Technology

- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **State:** TanStack React Query
- **Auth:** Appwrite SDK
- **Package Manager:** npm

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build (with lint) |
| `npm run build:docker` | Production build (skip lint — for Docker CI) |
| `npm run lint` | ESLint check |
| `npm start` | Start production server |

## Quality and Delivery

- Lint and type-check before merging (`npm run lint` + `npx tsc --noEmit`)
- CI validates install, lint, and build on push/PR
- Keep generated artifacts (`.next/`, `node_modules/`) out of commits

## Contributing

- Work in feature branches for pull requests
- Keep commits scoped and descriptive
- Include release notes for user-facing changes
