# Multi-stage Dockerfile for Next.js Full-Stack Application
# Single container serving both API and frontend

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/main#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
# npm's download cache stays on the build server between builds (any app): when a package is added, only
# the new ones are downloaded. npm checks each package against package-lock.json's hashes.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy .env file for build (if exists)
COPY .env* ./

# Build Next.js
ENV NEXT_PHASE=phase-production-build
ENV NODE_ENV=production
# An app without a public/ folder still has one for the copy below
RUN mkdir -p public
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# The app's folder is its user's, and the files are copied as theirs (--chown):
# a `RUN chown -R` after the copies stored every file a second time, about
# 90 MB more to push and pull on every deploy.
RUN chown nextjs:nodejs /app

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ is not part of the standalone build: without it every file in it (logos, pictures, scripts) is a 404
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { if (r.statusCode !== 200) throw new Error('Health check failed') })"

CMD ["node", "server.js"]
