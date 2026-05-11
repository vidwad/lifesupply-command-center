# LifeSupply Command Center — production image for Render.
#
# Based on the official Playwright image so chromium is pre-installed and
# Linux library deps are already pulled in. The supplier-portal automation
# (BBM01) uses this at runtime; the rest of the app is plain Next.js.
#
# Multi-stage build: deps + builder produce the standalone Next.js output,
# runtime is a slim final layer with only what's needed to serve.
#
# Render auto-detects this Dockerfile when the service is configured with
# `runtime: docker` in render.yaml.

ARG PLAYWRIGHT_VERSION=v1.59.1
FROM mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}-jammy AS base

# pnpm via corepack — version pinned in package.json `packageManager`.
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 1 — install dependencies (cached unless lockfile changes)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile --prod=false

# ---------------------------------------------------------------------------
# Stage 2 — build the Next.js app
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Skip migrations during build — they run on startup via the start script
# below. The build only needs Prisma Client generated.
RUN pnpm prisma generate
RUN pnpm exec next build

# ---------------------------------------------------------------------------
# Stage 3 — runtime
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a non-root user. Playwright base image already has `pwuser` — use
# it. Otherwise we'd add a `node` user manually.
RUN chown -R pwuser:pwuser /app
USER pwuser

COPY --from=builder --chown=pwuser:pwuser /app/.next ./.next
COPY --from=builder --chown=pwuser:pwuser /app/public ./public
COPY --from=builder --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --from=builder --chown=pwuser:pwuser /app/package.json ./package.json
COPY --from=builder --chown=pwuser:pwuser /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=pwuser:pwuser /app/prisma ./prisma
COPY --from=builder --chown=pwuser:pwuser /app/next.config.ts ./next.config.ts
# src + scripts + tsconfig are needed at runtime so `pnpm db:seed` and
# the audit-retention cron (`pnpm tsx scripts/cron/audit-retention.ts`)
# can resolve their imports. The Next.js app itself does NOT need src/
# at runtime — the .next bundle has everything baked in — but tsx-driven
# scripts do.
COPY --from=builder --chown=pwuser:pwuser /app/src ./src
COPY --from=builder --chown=pwuser:pwuser /app/scripts ./scripts
COPY --from=builder --chown=pwuser:pwuser /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# On startup: apply pending migrations, then boot Next. Migration is
# idempotent (no-op if already applied) so this is safe to run on every
# container start.
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
