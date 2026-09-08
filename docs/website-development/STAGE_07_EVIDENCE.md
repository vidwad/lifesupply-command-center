# Stage 7 — Inquiry capture and Command Center handoffs: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `c065d3d` (Stage 6 merged as PR #74, verification record #75)
**Branch:** `claude/website-stage-07-inquiry-capture`
**Predecessors:** Stages 1 to 6 on `main` in order. Not stacked.
**Decisions supplied with the kickoff:** none. WEB-10 (migration approval and a rehearsal target), WEB-07 (owners, retention, consent wording, acknowledgment sink), and the legal review of the policy pages all arrived unfilled. **Path (b) of the kickoff applies:** the intake is built against a persistence adapter, the table ships as a prepared migration, and no public form is published; the verified contact directory stays in place.

## 1. Work plan

WB-701 to WB-705: the contract in `IMPLEMENTATION_BACKLOG.md` §15 implemented as code with validation, allowlisting, and server-side owner mapping; an unauthenticated intake endpoint with size, origin, rate-limit, flag, readiness, and idempotency controls; a persistence adapter whose SQL implementation targets the prepared table and refuses submissions until it exists; acknowledgment and owner-notification deliveries with separate states, attempts, a kill-switched send flag, and a sink; a permission-gated staff queue with assignment, status, and a hand-off to the Tasks module; the public form as an unpublished component.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Contract | `src/server/public-inquiry/contract.ts` (new) | Eleven intents; ten persisted, existing-order support refused with a pointer to the store. Strict zod schema: contact (name, email, optional phone, organization, region), intent-allowlisted `fields` (max 500 chars each), consent with the service-response literal required and marketing separate and optional, optional UTM triple, client idempotency key, path-only `sourcePath` (no host, query, or fragment), empty honeypot. Forbidden keys (`to`, `recipient`, `cc`, `bcc`, `redirect`, `redirectUrl`, `returnUrl`, `id`, `assignedTo`, `owner`) are refused explicitly and unknown keys by strictness. `OWNER_CHANNELS` maps intent to an approved directory address; retention derives from the receive time (default 180 days, `PUBLIC_INQUIRY_RETENTION_DAYS`); references are random `LS-XXXXXXXX`; the client address is only ever a salted hash; `redactForLog()` is the only shape that reaches logs or audit rows. |
| Abuse controls | `abuse.ts` (new) | Origin check against `PUBLIC_SITE_ORIGINS` plus the Command Center origin (Referer fallback; no header refused; dev origins only outside production); 16 KB body ceiling checked before parsing; fixed-window in-process rate limit (5 per 10 minutes per hashed address). |
| Persistence adapter | `store.ts` (new) | `InquiryStore` interface; `MemoryInquiryStore` for tests and development; `SqlInquiryStore` with parameterised raw SQL against the prepared `public_inquiries` table, `ON CONFLICT (idempotency_key) DO NOTHING`, and an `isReady()` probe (`to_regclass`) cached for a minute. No Prisma model, no schema change. |
| Intake | `intake.ts` (new) | `receiveInquiry()`: size → origin → validation → intake flag (a failed lookup reads as disabled) → rate limit → readiness → idempotent create → audit `public_inquiry.received` with the redacted shape. Success only after the store confirms the row; a store failure logs its class, never the body, and returns `unavailable`. Reason-to-status map and visitor-safe messages. |
| Endpoint | `src/app/api/public/v1/inquiries/route.ts` (new) | POST only; reads the body as text to measure it; 201 on create, 200 on duplicate, 413/403/400/503/429/503 per refusal, `Retry-After` on 429, `no-store` always, the body never echoed. Added to the route-permission allowlist with its reason. |
| Deliveries | `delivery.ts` (new) | Two deliveries per record, each `pending → sent | failed | skipped` with attempts (max 3) and a generic `lastError`. Gated by `public_inquiry.send` (registered as a kill switch) and a configured email client; `PUBLIC_INQUIRY_SINK_EMAIL` redirects every message to the sink. The owner notification carries reference, intent, and source, not the visitor's details. Audit `public_inquiry.{acknowledgment,notification}_{delivered,failed}`. |
| Queue | `queue.ts` (new); `src/app/(dashboard)/public-web/inquiries/{page,[id]/page,actions,inquiry-controls}.tsx` (new) | `tasks.view` reads, `tasks.update` changes; every function checks in the service. Status machine `received → assigned → in_progress → closed`, `spam`; assign-to-me; hand-off creates a Task (`sourceType: public_inquiry`) whose title and description hold the reference and intent only. The list previews organization and region, never name, email, or phone. The page states plainly when the table is not provisioned. |
| Feature flags | `src/lib/feature-flags.ts`, `kill-switch.ts` | `public_inquiry.intake` and `public_inquiry.send`, both default off; send is a kill switch. |
| Public form | `src/components/public-site/inquiry-form.tsx` (new, **unpublished**) | Posts JSON with the idempotency key; success only on a server reference; path stripped of query and fragment; consent sentence and a separate marketing checkbox; honeypot; accessible errors. No page renders it (canary). |
| Migration artifact | `docs/website-development/migrations/stage-07-public-inquiry/{README.md,migration.sql}` | `public_inquiries` with unique reference and idempotency key, FK to users and tasks, status and intent checks, retention index. Not in `prisma/migrations/`. |
| Config | `.env.example` | `PUBLIC_SITE_ORIGINS`, `PUBLIC_INQUIRY_RETENTION_DAYS`, `PUBLIC_INQUIRY_HASH_SALT`, `PUBLIC_INQUIRY_SINK_EMAIL`. |
| Tests | `contract.test.ts`, `abuse.test.ts`, `intake.test.ts`, `delivery.test.ts`, `queue.test.ts`, `route.test.ts` (new); four Stage 7 canaries | See §4. |

Untouched: `src/proxy.ts`, Auth.js, `prisma/schema.prisma`, `prisma/migrations/`, every public page and the contact directory, the privacy page (no collection is live), workers, package versions, infrastructure, credentials, any operating site.

## 3. Content and business claims

None. No public sentence changed. The contact page still routes every intent to a verified page or an approved channel, with no form.

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database, `main` base `c065d3d`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Fails on pre-existing CRLF files only (BD-01) | Every changed and new file passes `prettier --check`. |
| `pnpm typecheck` | Pass | |
| `pnpm lint` | Pass | |
| `pnpm test` | Pass, 94 files, 1,231 tests | Up from 1,185. |
| Server-side tests required by the kickoff | All present and passing | **Single persistence per valid submission** (one row, one audit event without contact data, a reference returned); **duplicate and retry safety** (same key → same reference, no second row or audit; different keys → two rows); **invalid and abusive requests fail safely** (oversize before parsing, cross-origin and origin-less, forbidden keys, unknown keys, non-allowlisted fields, existing-order intent, honeypot, malformed key, rate limit, flag off, failed flag lookup); **no success on failed storage** (table absent → unavailable; store throws → unavailable, class logged without the body, no received event); **recipient injection refusal** (`to`, `recipient`, `cc`, `bcc`, `redirect*`, `returnUrl`, `id`, `assignedTo`, `owner` at top level and nested; owner mapping from intent only); **unauthenticated queue denial** (null actor and under-permitted actor refused at the service for list, get, and status change). Also: delivery skipped while off or unconfigured, sink routing, no re-send once sent, generic failure with attempt cap and no address in audit rows; route status mapping without echo. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build` | Pass | `/api/public/v1/inquiries`, `/public-web/inquiries`, `/public-web/inquiries/[id]` emitted. |
| `pnpm build` | Pass | |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` in public mode | 57 passed, 3 skipped | `evidence/stage-07/playwright-public.txt`; the public pages are unchanged. |
| Local intake probes without a database | `evidence/stage-07/intake-route-local.txt` | GET 405; no Origin 403; foreign Origin 403; recipient injection 400 with the offending key named and nothing echoed; existing-order intent 400; valid body 503 (flag lookup fails without a database, reads as disabled); 20 KB body 413; queue page without a session 307 to login; server log contains no visitor data. An earlier probe against a stale build showed a 500 on the valid-body case; the fail-closed guard was added and the fresh build answers 503. |
| Dashboard queue screens | **Not exercised** | No local database or session; their server paths are covered by the queue tests. |

## 5. Interim treatment for the unfilled decisions

| Placeholder | Treatment applied | Effect |
| --- | --- | --- |
| WEB-10 and a rehearsal target | Table shipped as a prepared migration; adapter refuses until it exists; intake flag default off | Adopt with the Stage 6 artifact in one migration PR after rehearsal; then enable the flag |
| WEB-07 owners | `OWNER_CHANNELS` maps each intent to an approved directory address (ongoing procurement → Ben Hastibakhsh; investor and shareholder → investor relations; acquisition → Abdul Ladha; the rest → corporate) | Product owner confirms or reassigns; per-record assignment overrides in the queue |
| WEB-07 retention | 180 days by default, configurable; deletion job not built | Stage 9 or the Phase 11 worker adds the scheduled purge |
| WEB-07 consent wording | One service-response sentence in the unpublished form; marketing separate | Privacy review edits the sentence before the form is published |
| WEB-07 acknowledgment sink | Sending off (kill switch); sink variable routes every message when set | Enable send only with the sink set first |
| Legal review of policy pages | Not received; privacy page unchanged because nothing is collected | Update the privacy page in the same PR that publishes the form |

## 6. What "not published" means here

The endpoint exists on the Command Center host but refuses every submission twice over (intake flag off; table absent). The form component exists but is rendered nowhere, and a canary keeps it that way. The contact page is unchanged. When WEB-07 and WEB-10 are recorded: adopt the migration, set `PUBLIC_SITE_ORIGINS`, turn on `public_inquiry.intake`, render `InquiryForm` on the contact page with the intent routing, update the privacy page, and only then consider `public_inquiry.send` with the sink.

## 7. Known limitations

- The rate limiter is per process; a second Render instance would have its own window. A shared limiter (database-backed by `client_hash` and `received_at`, both indexed in the prepared table) is a Stage 9 hardening item.
- Retention deletion is specified, not built.
- Assignment is by user id; the queue shows the id, not the name, until a small join is added when the table exists.

## 8. External-site work, deployment, migration, and external sends

None by the stage. Merging deploys the endpoint (refusing) and the queue screens. No migration is included. No message can be sent: the send flag is off and no sink is configured.
