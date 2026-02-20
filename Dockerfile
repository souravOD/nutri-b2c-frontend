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
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ARG NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID
ENV API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT} \
    NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT} \
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=${NEXT_PUBLIC_APPWRITE_PROJECT_ID} \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=${NEXT_PUBLIC_APPWRITE_DATABASE_ID} \
    NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID=${NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:docker

# 3) Runtime image: install only production deps, copy build
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install only production deps to keep image small
COPY package*.json ./
RUN npm ci --omit=dev

# Re-declare build-time args in this stage so they can be baked as runtime envs
ARG API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ARG NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID

# Make them available at runtime (Next server reads env for rewrites)
ENV API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT} \
    NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT} \
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=${NEXT_PUBLIC_APPWRITE_PROJECT_ID} \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=${NEXT_PUBLIC_APPWRITE_DATABASE_ID} \
    NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID=${NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID} \
    NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID=${NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID}

# Copy built app and static files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

# Lightweight healthcheck without curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
