# ==============================================================================
# EDUCATIONAL DOCKERFILE FOR NEXT.JS (MULTI-STAGE BUILD)
# ==============================================================================
# Multi-stage builds help create small, secure, production-ready images by keeping
# build tools out of the final container image.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Install dependencies only when needed
# ------------------------------------------------------------------------------
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117906869da922070e935836a996d975ba4970#nodealpine
# to understand why libc6-compat might be needed for Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files first to leverage Docker layer caching.
# If package.json doesn't change, Docker skips re-installing dependencies!
COPY package.json package-lock.json* ./
RUN npm ci

# ------------------------------------------------------------------------------
# STAGE 2: Rebuild the source code only when needed
# ------------------------------------------------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production during build
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Execute Next.js build
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 3: Production runner (final lightweight image)
# ------------------------------------------------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root system user for security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for Next.js cache directory
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
