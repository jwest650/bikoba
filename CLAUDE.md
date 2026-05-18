# Bikoba — Project Guide for Claude

Bikoba is a **multi-tenant marketplace API**. Buyers shop, sellers run stores with products, admins moderate. This file is durable project context for AI assistants — read it before making non-trivial changes.

## Stack

| Layer | Choice |
|---|---|
| Runtime / framework | Node.js 20+, NestJS 11 |
| Language | TypeScript (strict), `module: nodenext` |
| ORM / database | Prisma 6 + PostgreSQL |
| Auth | Passport-JWT (access + rotating refresh), bcrypt |
| Cache | Redis (ioredis client) |
| Search | Meilisearch (with Postgres `ILIKE` fallback) |
| Queue | BullMQ on the same Redis |
| Mail | nodemailer (SMTP, falls back to console log in dev) |
| Object storage | Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) |
| Validation | class-validator + class-transformer, global `ValidationPipe` |
| Security middleware | helmet, `trust proxy: 1`, CORS open |

## Modules (`src/`)

| Module | Status | Purpose |
|---|---|---|
| `auth` | shipped | Register / login / refresh / logout, email verification, **change-password** (revokes all sessions, queues an SMS to verified phones), JWT strategies, role guards. On login, computes a coarse device fingerprint via `ua-parser-js` (`browser|os|deviceType`, version-agnostic so browser auto-updates don't trigger false positives), persists it on the `Session` row, and compares against past sessions for the user; if unseen and the user has a verified phone, queues a `new-device-login` SMS. |
| `users` | shipped | Authenticated profile actions. Currently: `POST /users/me/phone` sets phone (unverified) and triggers a PHONE_VERIFY OTP. |
| `sms` | shipped | Africa's Talking integration. `SmsService` wraps AT SDK with console-log fallback when `AT_USERNAME` is unset. `OtpService` generates 6-digit codes, SHA-256-hashes them with phone as salt, enforces per-phone hourly rate limit via Redis (`incrWithTtl`), and a per-token attempt cap before invalidation. Endpoints: `POST /auth/otp/send`, `POST /auth/otp/verify`. SMS for KYC approve/reject/expire/reminder fires automatically when the user has a verified phone. |
| `seller-applications` | shipped | KYC flow. BUYER submits Ghana Card + selfie → admin reviews → on approve, role flips to SELLER (with notification email) and `expiresAt = now + KYC_VERIFICATION_TTL_MONTHS`. Applicant can cancel PENDING applications. Two daily BullMQ sweeps: **expiry** (03:00 UTC) flips overdue rows to EXPIRED, demotes the user, deactivates their stores, emails them; **reminders** (03:30 UTC) walks `KYC_REMINDER_OFFSET_DAYS` (default `30,7,1`) and emails sellers approaching expiry, using `lastReminderAt` to dedupe so the same milestone isn't sent twice. Re-submission moves a REJECTED / CANCELLED / EXPIRED row back to PENDING. |
| `prisma` | shipped | Global `PrismaService` |
| `mail` | shipped | nodemailer wrapper; console fallback when `SMTP_HOST` is unset |
| `storage` | shipped | Image uploads (`POST /media/images`). Streams to R2 if configured; otherwise falls back to writing under `./images/` (served at `/images/*` by an Express static handler). |
| `categories` | shipped | Hierarchical product categories |
| `stores` | shipped | Seller storefronts. Creation requires SELLER or ADMIN role (BUYERs go through `seller-applications` first). Each store has a `currency` (3-letter ISO, default `USD`) that's set at creation and **immutable thereafter** — products in the store inherit it, orders are denominated in it. |
| `products` | shipped | Products belong to a store; Redis-cached reads, Meili-indexed search. Currency **inherits from the store** — passing `currency` on create/update is only accepted if it matches the store's currency; otherwise 400. |
| `orders` | shipped | Buyer creates orders against one store at a time. Order creation runs inside a Prisma `$transaction` that conditionally decrements `Product.stock` per item with a `WHERE stock >= quantity` guard; insufficient stock throws and rolls everything back (safe under concurrent orders). Cancel restores stock in the same transactional pattern. Currency is the store's — no per-product check needed. Statuses: `CONFIRMED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`, with `CANCELLED` exit from `CONFIRMED`. Item rows snapshot product name / slug / price / currency at order time so history stays stable. Both SMS *and* email fire on `order-placed` (to seller), `order-shipped` and `order-out-for-delivery` (to buyer); SMS gated on verified phone. |
| `redis` | shipped | Shared Redis client + `wrap()` / `delByPattern()` helpers |
| `search` | shipped | Meilisearch bootstrap + `ProductsIndexer` |
| `queue` | shipped | BullMQ root + `email`, `kyc`, and `sms` queues. Email processor handles `verification` / `application-approved` / `application-rejected` / `kyc-expired` / `kyc-expiry-reminder` / `order-placed-seller` / `order-shipped-buyer` / `order-out-for-delivery-buyer`. SMS processor handles `kyc-approved` / `kyc-rejected` / `kyc-expired` / `kyc-expiry-reminder` / `password-changed` / `new-device-login` / `order-placed` / `order-shipped` / `order-out-for-delivery`. KYC processor handles `expire-due-applications` (03:00 UTC) and `send-expiry-reminders` (03:30 UTC), scheduled by `KycScheduler` via `Queue.upsertJobScheduler` (idempotent on boot). |
| `config` | — | `validateEnv` checks required keys at boot |

## Routing / surface area

- The global guard is `JwtAuthGuard` (registered via `APP_GUARD` in `auth.module.ts`). **Every route requires a bearer token unless decorated with `@Public()`.**
- Role gating: `@UseGuards(RolesGuard) @Roles(Role.SELLER, Role.ADMIN)`.
- Email verification gating: `@UseGuards(EmailVerifiedGuard) @RequireVerified()`.
- Multiple guards stack: `@UseGuards(RolesGuard, EmailVerifiedGuard) @Roles(...) @RequireVerified()`.
- Read current user with `@CurrentUser() user: AuthenticatedUser`.
- The homepage `/` is `@Public()` and serves the docs HTML from `src/docs.html.ts`.

## Coding conventions

- **Update DTOs are spelled out**, not generated with `PartialType`. The `@nestjs/mapped-types` dep isn't installed; don't add it.
- **Import style**: relative paths without `.js` extensions (tsconfig is `nodenext` but `package.json` has no `"type": "module"` — CJS resolution).
- **Slug regex** for all user-supplied slugs: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **Service methods that mutate also invalidate caches and update the search index** (see `ProductsService.create/update/remove`).
- **Single source of truth on ownership**: products check `product.store.ownerId`, not a denormalized `sellerId`. Stores check `store.ownerId`.
- **Pagination**: `take` (clamped 1–100, default 20) and `skip` (≥ 0, default 0) query params. There's a `clamp()` helper used in services — copy it, don't centralize it prematurely.
- **Conflict handling**: catch `Prisma.PrismaClientKnownRequestError` code `P2002` and throw `ConflictException` with a user-readable message.
- **No emojis, no comments that just restate the code**. Comments only when WHY is non-obvious.
- **Graceful degradation**: services that depend on external infra (Redis, Meilisearch, SMTP, R2) should no-op or fall back when the dependency is unavailable, not crash the request path. The exception is hard requirements like Postgres.

## Database workflow

- Schema: `prisma/schema.prisma`.
- Migrations: every model change → `yarn prisma migrate dev --name <change>`. This both applies the migration locally and regenerates the client.
- If you edit the schema without running `migrate dev`, the Prisma client types will be stale and TS will fail with `Module '"@prisma/client"' has no exported member 'X'`. Fix: run `migrate dev`.
- Migrations live in `prisma/migrations/`. Don't hand-edit migration files after they're applied.

## Auth flow (short version)

1. `POST /auth/register` → creates user, enqueues a verification email, returns access + refresh tokens (+ user).
2. Calls to protected routes carry `Authorization: Bearer <accessToken>`.
3. Access token expires (default 15m) → `POST /auth/refresh` with the refresh token. The refresh token is rotated and the previous one is invalidated.
4. Refresh-token reuse (presented token doesn't match the stored bcrypt hash) → **all sessions for that user are revoked**.
5. `JwtStrategy.validate` re-reads `isActive` and `isEmailVerified` from the DB on every request, so role/activation changes take effect on the next request.

## Environment variables

All in `.env` (gitignored) / `.env.example` (committed). Validator: `src/config/env.validation.ts`.

| Var | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | yes | Must differ in production |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | no | Default `15m` / `7d` |
| `BCRYPT_SALT_ROUNDS` | no | Default 12 |
| `APP_URL` | no | Used in verification links |
| `REDIS_URL` | no | Default `redis://localhost:6379`; cache + queue no-op when unreachable |
| `MEILI_HOST`, `MEILI_MASTER_KEY` | no | Blank disables; search falls back to Postgres ILIKE |
| `SMTP_*` | no | Blank `SMTP_HOST` logs emails to console |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | grouped | **All or none.** Partial config fails at boot. Blank → uploads fall back to `./images/` (gitignored) served at `${APP_URL}/images/*`. |
| `MAX_UPLOAD_BYTES` | no | Default 8 MiB |
| `EMAIL_VERIFICATION_TTL_HOURS` | no | Default 24 |
| `KYC_VERIFICATION_TTL_MONTHS` | no | Default 12. How long an approved seller application stays valid before the daily sweep expires it. |
| `KYC_REMINDER_OFFSET_DAYS` | no | Default `30,7,1`. Comma-separated days before `expiresAt` to send reminder emails. |
| `AT_USERNAME`, `AT_API_KEY` | grouped | Africa's Talking creds. **All-or-nothing** (validator enforces). Blank → SMS logs to console. Use `sandbox` username in dev. |
| `AT_SENDER_ID` | no | Alphanumeric sender, optional. Falls back to AT's shared short code if blank. |
| `AT_ENVIRONMENT` | no | `sandbox` or `production`. Informational only — actual env is driven by which API key/username pair you use. |
| `OTP_TTL_MINUTES` | no | Default 5. |
| `OTP_MAX_ATTEMPTS` | no | Default 5. Failed verifies invalidate the token. |
| `OTP_RATE_LIMIT_PER_HOUR` | no | Default 3. Per-phone sliding window via Redis. |

## Commands

```bash
yarn start:dev                              # watch mode
yarn build                                  # type-check + emit to dist/
yarn prisma migrate dev --name <change>     # schema change + regenerate client
yarn prisma generate                        # regenerate client only
yarn test                                   # jest
```

## Homepage docs (`src/docs.html.ts`)

Single TS file exporting a `DOCS_HTML` template literal — a self-contained HTML page with inline CSS, no external assets. Served at `GET /` by `AppController` with `Content-Type: text/html`.

Structure:
- Sidebar with primary nav (`Overview`, `Auth`, `Stores`, `Categories`, `Products`, `Media`) and per-module endpoint sub-links.
- One `<article class="page" id="X-page">` per primary view. CSS `:target` + `:has()` switches views without JavaScript.
- Active link styling lives in one CSS rule near the top — add new pages there too, otherwise the highlight breaks.

---

## Instructions for Claude

### Required: when a new controller is added, update the homepage docs

**Whenever you create or substantially modify a controller** (any class decorated with `@Controller(...)` in `src/`), you must also update [src/docs.html.ts](src/docs.html.ts) so the homepage reflects the new surface. This is not optional — uncovered endpoints leave the docs lying about what's shipped.

Specifically:

1. **Add a primary sidebar link** for the module if it doesn't have one yet:
   ```html
   <a class="primary" href="#<module>-page"><Module Name></a>
   ```

2. **Extend the active-link CSS rule** near the top of the `<style>` block so the new page highlights correctly. The selector list looks like:
   ```css
   body:has(#<module>-page:target) .sidebar a[href="#<module>-page"],
   body:has(#<module>-page :target) .sidebar a[href="#<module>-page"], { … }
   ```

3. **Add a `Module · Endpoints` sub-group** under the existing groups in the sidebar:
   ```html
   <div class="nav-group"><Module> · Endpoints</div>
   <a href="#<module>-<action>"><METHOD> /path</a>
   ```

4. **Add a new `<article class="page" id="<module>-page">`** at the bottom of `<main>`, mirroring the structure of existing pages (Stores, Categories, Products, Media):
   - `<header class="hero">` with eyebrow, h1, and one-line tagline.
   - A "How it works" or overview section.
   - One `<article class="endpoint" id="<module>-<action>">` per endpoint, with method badge (`.method.post` / `.get` / `.delete`), path, auth-pill (`Public` / `Bearer token` / `Verified email` / role chips), short description, request example, response example, and an error list.
   - Reuse existing CSS classes (`.endpoint`, `.method`, `.path`, `.auth-pill`, `.callout`, etc.) — don't add new CSS without reason.

5. **If the new module is "shipped"**, add it to the **Modules grid** on `#overview-page` with `<span class="status shipped">Shipped</span>`.

6. **Update this CLAUDE.md** — bump the module's row in the table under "Modules (`src/`)" and add anything non-obvious to "Coding conventions" if the controller introduces a new pattern.

Endpoint anchor IDs are kebab-case: `<module>-<action>` (e.g. `stores-create`, `products-list`, `media-upload`). Keep the IDs the source of truth for sidebar anchors — don't invent new ID schemes.

Do this in the same change as the controller. Don't open a follow-up TODO for it.

### General

- Default to **editing existing files** over creating new ones; only add files when the work doesn't fit somewhere existing.
- For any new env var, also: add it to `.env.example`, add it to `.env` (with a sensible local default or blank), and extend `validateEnv` if it's required or has a coherence rule.
- Don't add features beyond what was asked. Bug fixes don't need surrounding cleanup; one-off tasks don't need helper abstractions.
- When the user mentions a specific decision or preference (e.g. "no PartialType", "use manual UpdateDtos"), reflect it in this file under conventions so future sessions inherit it.
