# syntax=docker/dockerfile:1.7

# ── Stage 1: install every dependency (dev + prod) ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ── Stage 2: generate Prisma client and compile TypeScript ──────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
 && yarn build

# ── Stage 3: slim runtime image ─────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Production-only deps (drops nest CLI, ts-loader, jest, etc.)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production \
 && yarn cache clean

# Bring over what the builder produced. We keep the prisma CLI in the image
# so `prisma migrate deploy` runs at container start without re-pulling deps.
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/dist                  ./dist
COPY --from=builder /app/prisma                ./prisma

RUN chown -R node:node /app
USER node

EXPOSE 3000

# Apply any pending migrations, then start. Safe for production:
# `migrate deploy` only applies migrations recorded in prisma/migrations/.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
