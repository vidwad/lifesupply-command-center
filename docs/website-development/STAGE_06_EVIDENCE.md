# Stage 6 — Governed publishing and document delivery: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `2cd81c3` (Stage 5 merged as PR #73)
**Branch:** `claude/website-stage-06-governed-publishing`
**Predecessors:** Stages 1 to 5 on `main` in order. Not stacked.
**Decisions supplied with the kickoff:** none. DEC-03/BLK-07 (storage), publication roles, approved public documents, and WEB-10 (migration approval) all arrived unfilled. The treatments are in §5.

## 1. Audit of the existing foundation (WB-601)

| Layer | Found at `2cd81c3` | Consequence for this stage |
| --- | --- | --- |
| Schema | `PublicContentItem`, `PublicDocument`, `PublicMetricSnapshot`, `PublicContactChannel`; status enum `draft → under_review → approved → published → archived`; content type enum without a resource value; `effectiveAt`/`expiresAt` on content items only; `PublicDocument.fileKey` and `publicUrl` with no storage behind them | Workflow built on these columns; interim fields validated in `payload` JSON |
| Migration | `20260907235000_public_web_foundation` in the repository; production API behaviour shows it applied (D-09); `docs/36` and `docs/37` said "not applied" | Both documents now carry a dated correction |
| Deploy behaviour | `Dockerfile` line 75: `prisma migrate deploy && pnpm start`; `render.yaml` web service `autoDeploy: true` on `main` | **Any migration merged to `main` is applied to production on the next deploy.** The Stage 6 migration is therefore prepared, not placed in `prisma/migrations/` |
| Service | `getPublicLifeSupplySite()` published-only, strict DTO, no consumers | Kept; family readers added beside it |
| Route | `GET /api/public/v1/site` with generic 503 | Kept; six family routes added with the same failure contract |
| UI | `/public-web` count overview only; no editor, no approval action, no preview | Replaced with the editor, reviewer, and document screens |
| Permissions | `public_web.edit`, `public_web.approve` defined; Super Admin holds both, Executive holds approve, Marketing Manager holds edit (`prisma/seed/auth.ts`) | Used as the two roles; approval needs a second person |
| Audit | `writeAudit()` helper; no publication events | Eight event types written |
| Storage | none; `DEC-03` deferred and not accepted for production; `BLK-07` open; no staging (`BLK-02`, `DEC-PI-02`) | No file upload; public downloads only via an approved host allowlist that is empty until configured |
| Tests | contract shape only | 42 new server-side tests plus route, client, and canary coverage |

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Families and validation | `src/server/public-web/families.ts` (new) | Two families (`news` → `news_item`; `resource` → `corporate_page` + `payload.kind = "resource"`); strict zod payloads (https-only sources, ISO dates, paragraph limits, author/reviewer/dates on resources); `validateDraft()` stamps revision and reviewer from the workflow, never from the form; the state machine `TRANSITIONS`; `EDITABLE_STATUSES`; `isTimeValid()`; document input schema and the `PUBLIC_DOCUMENT_HOSTS` allowlist. |
| Workflow | `src/server/public-web/workflow.ts` (new) | `createDraft`, `saveDraft`, `transitionContent`, `createDocumentDraft`, `saveDocument`, `transitionDocument`. Permission checked inside the service (`PermissionDeniedError`); approval refused to the preparer; edits allowed only before approval and return an under-review record to draft; every mutation is an `updateMany` filtered on the caller's `updatedAt` token and the expected status (`ConflictError` on zero rows); publish re-validates the stored payload; audit events `public_content.{created,saved,submitted,rejected,approved,published,unpublished,archived}` and the `public_document.*` equivalents (`replaced` when the file reference changes). |
| Readers | `src/server/public-web/readers.ts` (new) | Published-only, window-filtered in the query and again in code; strict DTO projection; invalid rows skipped and reported; `documentDownloadPath()`; `resolvePublishedDocumentFile()` returns nothing unless published and host-approved. |
| Contracts | `src/server/public-web/contracts.ts` | `publicNewsItemDtoSchema`, `publicResourceDtoSchema`, `publishedDocumentDtoSchema` (same-origin `downloadPath`, never the raw URL), `publicFamilyListSchema`. Existing site DTO unchanged. |
| HTTP | `src/server/public-web/http.ts` (new); `src/app/api/public/v1/{news,news/[slug],resources,resources/[slug],documents,documents/[id]/file}/route.ts` (new) | Shared cache header on success; generic uncached 503 on any failure; 404 uncached for absent items; the file route re-checks status and host per request and 302-redirects with `no-store`. Added to the route-permission allowlist with reasons. |
| Dashboard | `src/app/(dashboard)/public-web/{page,actions,content-form,transition-buttons,document-form}.tsx`, `content/{page,new/page,[id]/page}.tsx`, `documents/{page,new/page,[id]/page}.tsx`; `src/components/shell/nav-config.ts` | Overview with role explanation; content list with status and family filters; create and edit forms; transition buttons rendered only for allowed moves (server re-checks); history from the audit log; document metadata records with the allowlist explained; "Public Website" nav entry behind `public_web.edit`. |
| Preview | `src/app/(print)/public-web-preview/[id]/page.tsx` (new) | Renders the exact public template with the stored record behind `public_web.edit`, outside the dashboard shell, `robots: noindex, nofollow`, with a status banner. The public site never links to it (canary). |
| Public client | `src/lib/public-site/published.ts` (new) | Server-to-server fetch from `PUBLIC_CONTENT_API_ORIGIN` (fallback: Command Center URL, then Render), validated against the same strict contracts, cached 300 s; `{ ok: false }` on network error, non-2xx, missing list endpoint, or contract mismatch; a single-item 404 is an absence. |
| Public pages | `pages/news.tsx` (`NewsPage` takes `Published<>` props; `NewsItemView`, `ResourceView`, `PublishedUnavailablePage`), `pages/investors.tsx` (`PublishedDocuments` section), `content/news.ts` (arrays removed; unavailable copy), `content/investors.ts` (published-section copy); `src/app/news/page.tsx`, `news/[slug]/page.tsx`, `resources/[slug]/page.tsx`, `investor-relations/documents/page.tsx` (fetch, `revalidate = 300`) | Company news and resources are governed; the historical releases and the on-request document records stay static under the eligibility policy; every governed section shows an "unavailable" note on outage instead of an empty list. |
| Routes registry | `routes.ts` | `/news/[slug]/` and `/resources/[slug]/` are live (served from the read model). |
| Migration artifact | `docs/website-development/migrations/stage-06-public-web-governance/{README.md,migration.sql,schema.delta.prisma}` | Additive migration and schema delta, with backfill from the interim payload fields and the rehearsal steps. Not in `prisma/migrations/`. |
| Config | `.env.example` | `PUBLIC_CONTENT_API_ORIGIN`, `PUBLIC_DOCUMENT_HOSTS` documented. |
| Tests | `families.test.ts`, `workflow.test.ts`, `readers.test.ts`, `routes.test.ts`, `published.test.ts` (new); canaries and registry tests updated; five Stage 6 canaries; route-permission allowlist; two browser tests | See §4. |
| Docs | `docs/36`, `docs/37` | Dated D-09 corrections. |

Untouched: `src/proxy.ts`, host and login helpers, Auth.js, `prisma/schema.prisma`, `prisma/migrations/`, workers, package versions, infrastructure, credentials, any operating site.

## 3. Content and business claims

No public sentence was added or changed except the fail-closed notes ("temporarily unavailable"), the "Published public documents" heading and its empty note, and the unavailable page copy. No record was published; the governed sections are empty on the production alias once this merges, and the two dynamic routes return 404 for every slug.

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database, `main` base `2cd81c3`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Fails on pre-existing CRLF files only (BD-01) | Every changed and new file passes `prettier --check`. |
| `pnpm typecheck` | Pass | |
| `pnpm lint` | Pass | |
| `pnpm test` | Pass, 88 files, 1,185 tests | Up from 1,140. |
| Server-side tests required by the kickoff | All present and passing | Unauthorized edit and approve denial (service level, touching nothing); published-only projection with no identifier, actor, or status on the wire; expiry and not-yet-effective exclusion in code even when the database returns the row; withdrawal makes a slug return null; revision conflicts on a stale token for save and for transitions; approver-cannot-approve-own; publish re-validation; generic 503 that names no cause with `no-store`; document file route 404 for unpublished, withdrawn, off-allowlist, or guessed ids; client fail-closed on network error, 503, contract breach, and missing list endpoint. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build` | Pass | `/news` static with 300 s revalidation; `/news/[slug]`, `/resources/[slug]` on demand; six API routes and eight dashboard routes emitted. One fix during the stage: `revalidate` must be a literal, not an imported constant. |
| `pnpm build` | Pass | |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` in public mode | 57 passed, 3 skipped | `evidence/stage-06/playwright-public.txt`. The governed sections rendered their fail-closed state because the Render endpoints do not exist until this merges. |
| Local API without a database | `GET /api/public/v1/news` → 503 `{"error":"Public website data is temporarily unavailable."}` | `evidence/stage-06/api-news-no-database.txt`. The Vercel deployment answers the same way by design. |
| Local route smoke | `/news` 200 with "Company news is temporarily unavailable"; `/news/anything`, `/resources/anything` 404; `/public-web-preview/x` 307 to login | |
| Dashboard screens | **Not exercised in session** | No local database and no session; the screens are typed, built, and their server paths are covered by the workflow tests. First exercise is on the Render deployment after merge (§9). |

## 5. Interim treatment for the unfilled decisions

| Placeholder | Treatment applied | Effect |
| --- | --- | --- |
| DEC-03/BLK-07 storage provider | No upload; a document file is an https URL on an allowlisted host (`PUBLIC_DOCUMENT_HOSTS`), empty by default, so every published document currently reads "on request" | When storage is decided, the adapter attaches at `fileKey`/`storageProvider` in the prepared migration and the same download route serves it |
| Publication roles and approvers | The existing two permissions; approval requires a user other than the preparer; seeded roles unchanged | Product owner assigns roles in Admin; no seed change was made |
| Approved public documents | None entered; the static on-request records remain | A document record is created in `/public-web/documents` when one is approved |
| WEB-10 migration approval | Migration prepared as a reviewed artifact with backfill and rehearsal steps; not merged, not applied; code runs on the current schema | Adoption is its own PR after rehearsal (BLK-02) and sign-off |

## 6. Restricted-document request and delivery design (WB-605)

Restricted material is **never entered** into `public_documents`; the table is public-class by definition until the prepared migration adds `accessClass`. Today's path: the investor pages list restricted records as static metadata with a request action to `invest@lifesupply.com`. Proposed delivery, deferred until storage and the Stage 7 inquiry contract exist: a request creates a `PublicInquiry` (intent `investor`), an approver records suitability and any confidentiality terms in the Command Center, and delivery is a short-lived, single-use, signed link to an object in private storage, logged as `public_document.delivered`, never a public URL and never a same-origin path guessable from an id. Until then the request route remains and restricted delivery is **deferred**.

## 7. Cache and withdrawal behaviour (WB-606)

- Read model: a withdrawn or expired row is excluded at the next read; there is no static fallback for governed families, so nothing resurrects it.
- API: `s-maxage=300, stale-while-revalidate=900` on success; failures and 404s are `no-store`.
- Public site: `revalidate = 300` on the governed pages. Worst-case propagation of a withdrawal is therefore about ten minutes without a push.
- Proposal (not built): a signed revalidation event from the workflow to the public deployment, with a narrowly scoped secret, timestamp and replay protection, and a path allowlist, would cut that to seconds. It needs its own approval (guide §5) and is out of scope here.

## 8. External-site work, deployment, migration, and external sends

None by the stage. Merging deploys the Render web service (new API routes and dashboard screens) and the Vercel public alias (governed pages now fetching from Render). No migration is included. No message was sent.

## 9. Limitations and follow-ups

- **Post-merge verification (recorded 2026-09-08 after PR #74 merged as `de906d7`):** Render answered `/api/public/v1/news`, `/resources`, and `/documents` with 200 and empty lists about three minutes after the merge; `/api/public/v1/news/anything` and `/api/public/v1/documents/clzzz/file` answered 404; the success cache header is `public, s-maxage=300, stale-while-revalidate=900`; `/public-web-preview/anything` without a session redirected to `/login`. The production alias, built before Render finished, showed the fail-closed note and revalidated to the honest empty note within about five minutes, exactly the propagation window in §7. Vercel's own `/api/public/v1/news` answers the generic 503 because it has no database. **Still owed:** one create → submit → approve (second user) → publish → withdraw cycle on Render with the audit history checked; it needs two accounts and was not possible from this session.
- Metrics, contact channels, and corporate pages stay static on the public site; their readers follow once the metric model gains currency and entity scope (prepared migration).
- The interim payload fields (`revision`, `reviewerId`) and the resource-on-corporate-page mapping are promoted by the prepared migration's backfill; the mapping table in `families.ts` is the single place to change.
- BD-01 to BD-06 untouched.
