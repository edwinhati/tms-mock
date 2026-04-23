# ============================================
# Base Stage - Common Dependencies
# ============================================
FROM oven/bun:alpine AS base

WORKDIR /app

# Install system dependencies including Node.js (needed for some postinstall scripts)
RUN apk add --no-cache \
    libc6-compat \
    libpq \
    openssl \
    ca-certificates \
    wget \
    nodejs \
    npm

# ============================================
# Dependencies Stage - Install all packages
# ============================================
FROM base AS deps

COPY bun.lock* package.json* ./

# Install dependencies
RUN bun install --prefer-offline

# ============================================
# Production Build Stage - Build the app
# ============================================
FROM deps AS builder

WORKDIR /app

# Copy the rest of the application code
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the application
RUN bun run build

# ============================================
# Production Runner Stage - Final image
# ============================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./

RUN chown -R nextjs:nodejs /app

USER nextjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]
