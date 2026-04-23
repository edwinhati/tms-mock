# ============================================
# Stage 1: Dependencies Installation
# ============================================
FROM oven/bun:alpine AS base

# Install system dependencies (needed for native modules like Sharp)
RUN apk add --no-cache \
    libc6-compat \
    libpq \
    openssl \
    ca-certificates \
    wget

WORKDIR /app

# Copy package-related files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================
# Stage 2: Build Next.js application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy application source code
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the application using standalone output
RUN bun run build

# ============================================
# Stage 3: Runner
# ============================================
FROM oven/bun:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build and necessary assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure correct permissions
RUN chown -R bun:bun /app

USER bun

EXPOSE 3000

# Start the standalone server
CMD ["bun", "server.js"]
