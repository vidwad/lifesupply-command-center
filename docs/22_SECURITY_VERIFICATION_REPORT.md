# Security Verification Report — Phase 11C

**Document status:** Phase 11C written review + findings log (Ready for Review)
**Controlling plan:** `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §4 (11C)
**Register rows covered:** 11C-01 … 11C-15; launch gates GATE-04, GATE-05, GATE-08, GATE-10 (design side)
**Method:** full code review of the auth/permission/vault/AI surface + new automated verification tests. **No live environment was tested** — every control marked "live" below needs staging (11B) and is tracked as Evidence Required.
**Prepared:** August 5, 2026

---

## 1. Authentication and session review (11C-01, 11C-02)

Auth.js (NextAuth v5), JWT strategy, single Credentials provider
(`src/server/auth/config.ts`).

| Control | Status | Detail |
|---|---|---|
| Password hashing | ✅ | bcrypt cost 12 at every write site (user create, admin reset, seed) |
| Inactive-account login block | ✅ | `authorize()` rejects unless `status === "active"` — suspended/archived users cannot sign in |
| User enumeration | ✅ | Login action returns a generic "Invalid email or password" for all failures |
| Session expiry | ✅ **hardened this phase** | Was the Auth.js 30-day default; now `maxAge` 24 h, `updateAge` 1 h (F-03) |
| Secure cookies | ✅ (by default) | No custom `cookies:` block → Auth.js defaults: httpOnly, sameSite=lax, `__Secure-`/secure on https. Live verification of the served cookie flags is a staging check |
| Open-redirect on login | ✅ **hardened this phase** | `redirectTo` now restricted to same-origin paths (`/…`, not `//…`) on top of Auth.js's own same-origin redirect callback (F-04) |
| Failed-login audit / lockout / rate limit | ❌ **Finding F-01** | `authorize()` returns null silently — no audit event, no counter, no lockout |
| Permission freshness | ⚠️ **Finding F-02** | Permissions/roles/suspension are baked into the JWT at login and never re-checked against the DB; the 24 h `maxAge` now bounds the lag (was 30 days) |
| Password reset | ⚠️ noted | Admin-driven only (`resetPasswordAction`); no self-service flow, no reset tokens. `/forgot-password` is whitelisted but has no page — harmless, but remove or implement (F-08) |
| Secret rotation | 📋 procedure | `AUTH_SECRET` rotation invalidates all JWTs (acceptable — forces re-login). `MASTER_ENCRYPTION_KEY` rotation requires re-encrypting vault rows; no tooling exists — rotation runbook is a follow-up (F-09) |

Session-expiry behavior, cookie flags on the wire, and account-disablement
propagation must be **re-verified live in staging** (Evidence Required).

## 2. Server-side permission enforcement (11C-03)

25 API route files exist. **24 call `requirePermission(...)`; the single
exception is `/api/health`**, unauthenticated by design (uptime probe;
body reviewed in 11B-12 — status enums, uptime, environment label, flag
posture only). The `(print)` route group is gated (`requireUser` in its
layout + `REPORTS_VIEW` on the print page). Middleware (`src/proxy.ts`)
provides session redirects only; authorization is always per-route/page.

**Automated regression guard added:** `src/server/security/route-permissions.test.ts`
scans every `src/app/api/**/route.ts` and fails CI if any route lacks
`requirePermission` without an explicit, documented allowlist entry
(allowlist: NextAuth handler, `/api/health`). It also asserts every
export-shaped route gates on an `*_EXPORT` permission and that allowlist
entries can't go stale.

Route-by-route matrix (from code review):

| Area | Routes | Permission |
|---|---|---|
| BigCommerce/GA4/QBO sync + jobs + reconciliation + integration test | 11 | `admin.manage_integrations` |
| Mailchimp member sync | 1 | `marketing.sync_mailchimp` |
| QuickBooks OAuth connect/callback | 2 | `admin.manage_integrations` |
| Automation evidence payloads | 1 | `suppliers.view` |
| Exports: orders / customers ×2 / products / financials ×2 / forecast | 7 | matching `*.export` keys |
| Report PDF | 1 | `reports.export` |
| Health | 1 | none (allowlisted) |
| NextAuth | 1 | n/a |

Known behavior (F-05, low): denial inside API routes surfaces as a
redirect (no session) or a 500 (`PermissionDeniedError` uncaught) rather
than clean 401/403 status codes. Access **is** denied in both cases;
status-code hygiene is a cosmetic follow-up.

## 3. Export-route review (11C-05)

All eight data-egress routes (§2 table) are permission-gated with
export-specific keys, and export audit actions (`export.*`) are on the
never-pruned audit list. Live per-role probing of each export is part of
the 11C-04 staging pass.

## 4. Secret exposure (11C-06, GATE-05)

- **New CI control:** `scripts/security/scan-bundle-secrets.mjs` runs after
  every CI build and fails the pipeline if any secret-shaped value
  (Anthropic/OpenAI keys, AWS key ids, private-key blocks, credentialed
  Postgres DSNs, Inngest signing keys, Mailchimp keys) appears in the
  **client** assets (`.next/static` — the only files browsers receive).
  Findings are printed redacted.
- Code review: AI provider keys are resolved server-side only
  (`resolveCredential`); no `NEXT_PUBLIC_*` secret exists; the logger
  redacts `password`/`apiKey`/`token`/`secret`/`authorization`/`cookie`
  fields (one level deep — F-07, low).
- **Live half (Evidence Required):** runtime log review and deployed
  source-map check in staging.

## 5. Vault verification (11C-07)

`src/server/security/secrets.ts`: AES-256-GCM, 12-byte random IV per
record, auth tag enforced, packed `iv.tag.ciphertext` format, strict
32-byte key check.

**New tests** (`src/server/security/secrets.test.ts`) prove: round-trip;
unique IV per encryption; key-mismatch → `SecretVaultDecryptError`;
ciphertext tamper → decrypt failure (GCM integrity); malformed input
rejection; missing key → `SecretVaultNotConfiguredError` and
`vaultEnabled() === false`; wrong-length key treated as not-configured;
`lastFour` never reveals more than four characters.

Credential lifecycle audit events verified in code:
`integration.field_set` / `field_rotated` / `field_cleared`, plus
QuickBooks connect/connect-failed events. Noted (F-09): no key-version
marker in the packed format — master-key rotation needs a re-encryption
procedure before it is ever attempted.

## 6. AI data filtering and prompt-injection posture (11C-08)

Existing automated coverage, verified and cited:

- `ai/ai-filters.test.ts` — dashboard context redacted per
  `ai.use_financial_context` / `ai.use_customer_context`.
- `ai/agents/guardrails.test.ts` — untrusted-data fencing, marker-lookalike
  defusal (tested against a malicious payload), read-only canaries,
  structured-envelope rejection of prose.
- `ai/agents/registry.test.ts` — per-tool permissions are real keys; every
  tool read-only.
- `ai/actions.test.ts` — AI mutations require permission **and** the
  `ai.actions` flag.
- `ai/mutation-guard.test.ts` — AI service writes only `AiOutput` unless
  gated.

Agent tool collection runs with the **triggering user's** permissions and
records permission-based skips on the run — reviewed in Phase 10, still
accurate.

## 7. High-risk combined controls (11C-14, GATE-10 design side)

**New canary suite** (`src/server/security/chokepoints.test.ts`) makes
removing a gate a CI failure. Per capability it asserts the source still
wires the flag gate (+ approval where the model requires it) and audit:

| Capability | Flag | Approval | Audit | Canary |
|---|---|---|---|---|
| Mailchimp export/send | `mailchimp.send` | Campaign approval flow | ✅ | ✅ |
| Supplier order submission | `supplier.order_submit` (+ `supplier.automation`) | Approval row must be `approved` | ✅ | ✅ |
| Supplier portal checks | `supplier.automation` | n/a (read-only) | ✅ | ✅ |
| Investor release | `investor.distribution` | `investor_material` approval | ✅ | ✅ |
| Forecast generation | `forecasting.enabled` | `forecast` approval for external use | ✅ | ✅ |
| AI mutations | `ai.actions` | via `requireAiAction` | ✅ | ✅ |

The suite also asserts the kill switch covers all seven external-action
flags and that flags default OFF when no row exists. **Live combined-control
tests** (actually attempting each action per role in staging) remain
Evidence Required.

## 8. Feature-flag posture (11C-09, GATE-10)

Code posture: all flags default OFF; kill switch verified (§7); staging
smoke workflow fails if any high-risk flag is ON. The evidence item — a
flag-state export from a deployed `/admin/feature-flags` — needs staging.

## 9. Data retention and deletion policy — DRAFT for owner approval (11C-12)

| Data class | Retention | Mechanism | Deletion path |
|---|---|---|---|
| Audit logs (general) | 365 days (`AUDIT_RETENTION_DAYS`, floor 30) | Daily cron + manual button | Automatic prune |
| Audit logs (auth, approvals, financials, reports, investor, automation runs/orders, credential + flag changes, user account events, exports/imports) | **Indefinite** | Never-pruned list (tested) | None — by design |
| Customer PII (BigCommerce-synced) | Life of the record | Sync upserts; `deletedAt` soft delete | Proposed: honor source deletion on full sync + manual erasure procedure for verified CASL/PIPEDA requests — **owner to approve** |
| Consent + suppression records | Indefinite while operating | Consent columns + audit | Never auto-deleted (compliance evidence) |
| AI prompts/outputs | Proposed: 24 months, then archive/prune except approved outputs referenced by reports | Not yet implemented — decision needed | Proposed follow-up |
| Supplier evidence screenshots | Proposed: 12 months | Postgres (`automation_evidence.data`) | Proposed follow-up prune job |
| Exports (CSV/XLSX/PDF) | Not persisted server-side (streamed) | n/a | Recipient-side responsibility — note in ops guide |
| Forecast scenarios / reports | Indefinite (versioned management records) | Archived status | Manual archive |

Proposed rows need product-owner approval; the two "not yet implemented"
prune jobs become follow-up work items once approved.

## 10. Findings log (11C-15)

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| F-01 | Medium | No failed-login audit event, lockout, or rate limit | **Open** — recommend: audit event + modest lockout before production (target 11C-15 close) |
| F-02 | Medium | JWT sessions never re-check the DB; permission/suspension changes lag until token refresh | **Mitigated** this phase by 24 h `maxAge` / 1 h `updateAge`; full fix (per-request status check or short-TTL re-mint) optional follow-up |
| F-03 | Medium | Session lifetime was the 30-day Auth.js default | **Fixed** this phase (`maxAge` 24 h) |
| F-04 | Low | `redirectTo` passed unvalidated into `signIn` | **Fixed** this phase (same-origin path check; Auth.js default was already same-origin) |
| F-05 | Low | API permission denials return redirect/500 instead of 401/403 | **Open** — cosmetic; access is denied. Follow-up: catch `PermissionDeniedError` in route handlers |
| F-06 | High (deploy-time) | Seed fallback password `DevAdmin!2026` usable in deployed environments; re-seed re-forces it | **Fixed** this phase — seeding now throws in production/`DEPLOY_ENV` unless `DEV_ADMIN_PASSWORD` is set (feeds GATE-09) |
| F-07 | Low | Logger redaction is one level deep | **Open** — accepted for now; deep-redaction follow-up |
| F-08 | Info | `/forgot-password` whitelisted but no page exists | **Open** — remove from whitelists or implement |
| F-09 | Low | No vault key-version marker; master-key rotation lacks tooling/runbook | **Open** — write rotation procedure before first rotation |
| F-10 | Medium | Vault had zero test coverage | **Fixed** this phase (`secrets.test.ts`, 9 tests) |

No finding gives unauthorized access to sensitive data in the current
code (GATE-04 code-review pass); F-01 is the only Medium+ that should
close before production sign-off.

## 11. Security test matrix (11C-13 skeleton)

Roles (docs/06 §4 / seed): Super Admin, Executive, Finance Manager,
Operations Manager, Marketing Manager, Product Manager, Customer Service,
Investor Relations, External Advisor, Developer/Technical Admin.

| Control | Automated (this repo) | Live per-role (staging) |
|---|---|---|
| Route permission coverage | ✅ `route-permissions.test.ts` | ⏳ 11C-04 probing |
| Export gating | ✅ (same suite) | ⏳ per-role export attempts |
| High-risk chokepoints | ✅ `chokepoints.test.ts` | ⏳ combined-control attempts |
| Vault behavior | ✅ `secrets.test.ts` | ⏳ key-mismatch on deployed env |
| AI redaction/injection | ✅ existing AI suites | ⏳ per-role agent runs |
| Session/cookie behavior | ⏳ n/a | ⏳ cookie flags, expiry, disablement |
| Privilege escalation attempts | — | ⏳ 11C-04 (must be attempted access) |

The live column is executed once staging exists (11B), one row per role,
results recorded here.

## 12. Items outside repository reach

Staging-dependent: live 11C-02 control tests, 11C-04 escalation attempts,
runtime-log/source-map half of 11C-06, 11C-09 flag-state export, live
halves of 11C-13/14. Owner/advisor-dependent: 11C-10 CASL counsel review
(**DEC-08** — dependency recorded, not assumed), 11C-11 privacy impact
assessment (owner; can start from §9), retention-policy approval (§9),
named accountable people (DEC-09).
