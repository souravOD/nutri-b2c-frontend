## ---------- Frontend Dockerfile (Next.js 15) ----------
## Multi-stage build for smaller production image

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 1) Install deps separately to cache better
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# Need devDependencies for build (Next.js + Tailwind)
RUN npm ci --include=dev

# 2) Build with API base configured so Next rewrites proxy to backend service
# Note: rewrites are evaluated at build-time by Next. Provide `API_BASE_URL`
# as a build-arg (or NEXT_PUBLIC_API_BASE_URL) when building this image.
FROM base AS builder
WORKDIR /app
ARG API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ARG NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT} \
    NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT} \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=${NEXT_PUBLIC_APPWRITE_DATABASE_ID} \
    NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID=${NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:docker

# 3) Runtime image: use standalone output for minimal footprint (~200MB vs ~1GB)
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

# DOCKER-02: IMPORTANT — NEXT_PUBLIC_* vars are inlined into the JS bundle
# at build time by Next.js. Changing them at runtime has NO effect in standalone
# mode. Coolify handles this correctly by rebuilding on env changes.
# For truly dynamic config, use a publicRuntimeConfig pattern.
ARG API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ARG NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Make them available at runtime (Next server reads env for rewrites)
ENV API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT} \
    NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT} \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=${NEXT_PUBLIC_APPWRITE_DATABASE_ID} \
    NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID=${NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Standalone output: only copy the self-contained server + static assets
# No need for npm ci or node_modules — deps are bundled in standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# Lightweight healthcheck without curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Standalone server is a plain Node script, no npm required
CMD ["node", "server.js"]
