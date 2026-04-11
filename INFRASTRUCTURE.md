# NutriSmarts B2C - Infrastructure Documentation

> **Last Updated:** April 11, 2026
> **Server:** Server 2 - Clients (207.244.226.234)
> **Repository:** `git@github.com:ConferInc/nutri-b2c.git`
> **Production URL:** https://app.nutrismarts.ai

---

## Overview

NutriSmarts B2C is a consumer-facing nutrition and wellness application providing:
- **Personalized nutrition plans** with AI recommendations
- **Meal tracking** and dietary analysis
- **Health goal setting** and progress monitoring
- **Integration with fitness devices** and health apps

This is the frontend application. See `ConferInc/nutrition-backend` for the backend API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | Tailwind CSS + shadcn/ui |
| **State** | React Query + Zustand |
| **Auth** | Appwrite Auth |
| **API Client** | Axios |

---

## Server 2 Environment

### Running Services

| Service | Coolify UUID | Status | Purpose |
|---------|--------------|--------|---------|
| confer-inc/nutri-b2c | `x4o4ooosgo4gcw8s048wok8c` | healthy | B2C Frontend |
| confer-inc/nutrition-backend | `d0c8kogkk0w0ks8k0owo0848` | healthy | Backend API |
| Supabase-Odyssey | `wk8c40o0kokcogw4wksc8s48` | healthy | Database (shared) |
| litellm | `ps0cgcwgwcgkocs8wo48sc8c` | healthy | AI Gateway |

---

## Required Environment Variables

```env
# API Connection
NEXT_PUBLIC_API_URL="https://api.nutrismarts.ai"

# Appwrite Auth
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://appwrite.endpoint"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="project-id"

# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN="..."
NEXT_PUBLIC_GA_ID="..."

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_DEVICE_SYNC=true
```

---

## Local Development

### Prerequisites

- Node.js >= 20
- npm or pnpm
- Backend API running (see nutrition-backend repo)

### Quick Start

```bash
# Clone repository
git clone git@github.com:ConferInc/nutri-b2c.git
cd nutri-b2c

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### NPM Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
npm run lint         # Run ESLint

# Build
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:e2e     # E2E tests
```

---

## Project Structure

```
nutri-b2c/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, registration
│   ├── (dashboard)/          # Authenticated pages
│   │   ├── meals/            # Meal tracking
│   │   ├── plans/            # Nutrition plans
│   │   ├── goals/            # Health goals
│   │   └── profile/          # User profile
│   └── api/                  # API routes (BFF)
├── components/               # Shared components
│   ├── ui/                   # shadcn/ui components
│   ├── meals/                # Meal-related components
│   └── charts/               # Data visualizations
├── lib/
│   ├── api/                  # API client
│   ├── auth/                 # Appwrite auth
│   └── utils/                # Utilities
├── stores/                   # Zustand stores
└── types/                    # TypeScript definitions
```

---

## Coolify Management

```bash
# List apps on Server 2
coolify --context server2 app list

# Restart B2C frontend
coolify --context server2 app restart x4o4ooosgo4gcw8s048wok8c

# View logs
coolify --context server2 app logs x4o4ooosgo4gcw8s048wok8c

# Redeploy
coolify --context server2 deploy uuid x4o4ooosgo4gcw8s048wok8c
```

---

## Related Repositories

- **Backend:** `ConferInc/nutrition-backend` - Express.js API
- **Shared Types:** Included in backend repo

---

## SSH Access (Server 2)

```bash
ssh root@207.244.226.234
# Password: See Tech Secrets
```

---

## Related Documentation

- **Coolify Infrastructure:** See Obsidian `Coolify-Infrastructure.md`
- **Tech Secrets:** See Obsidian `Secrets/Tech Secrets.md` for credentials

---

*Document created April 11, 2026 for AI agent infrastructure context.*
