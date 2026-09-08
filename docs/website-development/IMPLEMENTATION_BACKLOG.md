# Stage 1 — Implementation Backlog

**Prepared:** September 8, 2026 against `main` at `148617e`. Work items are grouped by the stage that owns them. Each names its acceptance criteria, dependencies, current files, and the decision it waits on. Design proposals in §11–§14 are specifications only; nothing here is implemented.

IDs: `WB-nn` website work items; `BD-nn` baseline defects from `BASELINE_AUDIT.md` §7 that need a bounded fix outside the visual stages.

---

## 1. Baseline defects (bounded fixes; not part of a visual stage)

| ID | Item | Acceptance | Dependencies | Files | Decision |
| --- | --- | --- | --- | --- | --- |
| BD-01 | Line-ending normalisation so `pnpm format:check` passes on Windows checkouts (D-01) | `format:check` green locally with `core.autocrlf=true`; no content changes | none | `.gitattributes` (new) | none; housekeeping PR |
| BD-02 | Public-mode health endpoint (D-02) | on a database-free host `/api/health` returns 200 with a body that says database checks are not applicable, or 503 with the documented shape; never 500 | none | `src/app/api/health/route.ts` | whether Vercel should expose health at all |
| BD-03 | Public-host route-family isolation (D-03) | on a public host every `(dashboard)` route family and every non-public API redirects directly to `/`; regression test enumerates the families from the file system | none | `src/proxy.ts`, `src/lib/public-site/public-boundary.test.ts`, `tests/e2e` | scoped security fix, reviewed on its own |
| BD-04 | CI Node version aligned with the pin (D-04) | `ci.yml` uses Node 24; docs/37 corrected | none | `.github/workflows/ci.yml`, `docs/37` | none |
| BD-05 | Runbook correction for the applied migration (D-09) | docs/36 and docs/37 state the actual migration status with the Render evidence | Render migration log | `docs/36`, `docs/37` | WEB-10 |
| BD-06 | Prisma config deprecation (D-10) | `pnpm build` warning-free | none | `package.json`, `prisma.config.ts` (new) | none |

---

## 2. Stage 2 — Public shell, Home, About

| ID | Item | Acceptance | Dependencies | Files | Decision |
| --- | --- | --- | --- | --- | --- |
| WB-201 | Typed brand registry (§11) | six entries; unknown legal relationship stored as `null`; canonical URLs verified list; unit test asserts no `srsltid` and only HTTPS | S-01–S-07 | `src/lib/public-site/brands.ts` (new), tests | WEB-01 for relationship fields (may stay null) |
| WB-202 | Route/action registry (§12) | every action resolves to a verified "today" destination; canary rejects `mailto:` targets not in the approved channel list | ROUTE_AND_ACTION_MAP §2 | `src/lib/public-site/routes.ts`, `actions.ts` (new) | WEB-07 owners may stay unassigned |
| WB-203 | Grouped navigation: primary six + utility three + footer, desktop and mobile, no hover requirement | keyboard-operable groups; mobile exposes all paths; `aria-current` preserved; entries without a live destination omitted or routed to `/contact/` | WB-201/202 | `lifesupply-layout.tsx`, e2e spec | none |
| WB-204 | Home page contract | group introduction, verified proof (three approved figures only), four brands with links, clinic lifecycle, metabolic opportunity (as in development), partner/investor paths, current news (historical label), closing contact; hero footage retained | S-120 review; WB-201 | `lifesupply-pages.tsx` (split by family), content | product owner approves copy |
| WB-205 | About page contract | current introduction, footprint (CA + US, BC observed), sourced milestones, philosophy, brands, growth direction | dated milestone sources (none approved yet: S-133 is pixels) | content, pages | WEB-02 |
| WB-206 | Content module split | `lifesupply-content.ts` split into `content/{brand,home,about,…}.ts` with one governed barrel; canaries updated | none | `src/lib/public-site/content/*` | none |
| WB-207 | Operating-brand marks | authentic files with source/usage record under `public/lsh/brands/`; `next/image` with real dimensions; canary checks dimensions | S-135 owners | assets, content | WEB-08 asset owners |
| WB-208 | Stage 2 evidence | screenshots at 390/768/1440 of Home, About, open menus, footer; checks recorded | — | `docs/website-development/STAGE_02_EVIDENCE.md` | — |

Exit rule: no speculative metric, no dead primary action, Render login exact, reduced motion and keyboard menus verified.

---

## 3. Stage 3 — Four brands, Clinic Solutions, Shop & Services

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-301 | `/our-operations/` portfolio map | brands vs legal entities vs shared capabilities vs developing programmes; timeline text in HTML or image labelled historical (D-08) | WB-201; WEB-01 | WEB-01 |
| WB-302 | Four brand pages | each with verified canonical link, geography/currency, audience, categories from the verified URL list only, support boundary, one primary action | S-80–S-88; WB-207 | WEB-01 (Balkowitsch relationship wording) |
| WB-303 | `/our-operations/technology-fulfilment/` | implemented vs developing capabilities; no operational data; Command Center described as management systems only | product owner list of capabilities | none |
| WB-304 | Clinic Solutions hub + three children | three needs routed; existing clinic bypasses construction; verified Clinics consultation and quote destinations; delivery-role attribution; project examples only with permission | WEB-03 | WEB-03 |
| WB-305 | Shop & Services (`/shop/`) | four choices; geography/currency; support boundary; URL kept; no cart/pricing | WB-201 | commerce owner |
| WB-306 | Contact directory with intent routing | intent links (no form) to the action registry; existing-order support goes to the store | WB-202 | WEB-07 |
| WB-307 | External-site handoff notes (draft) | per-site destination mapping for reciprocal links, marked "proposed" | — | WEB-08 |

---

## 4. Stage 4 — Metabolic Health and eight pathways

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-401 | Division hub and kit hub | availability status explicit; starter/refill/occasional distinction; no drug/dosing implication | WEB-04 | WEB-04 |
| WB-402 | Kit template + eight configurations (§13 model) | purpose, audience, verified contents/quantities or an honest "programme information" state, compatibility, one-time vs refill, exclusions, availability, support, FAQs, working next step | approved bill of materials per kit (none available) | WEB-04 |
| WB-403 | Refills page | reminder vs automatic shipment, intervals, pauses, cancellation, substitutions, only as supported | actual refill capability | WEB-04 |
| WB-404 | Store links | only verified category URLs as "browse"; no SKU links until an approved configuration exists; K03 has no URL (S-89) | S-80–S-90 | WEB-04 |
| WB-405 | Discount rule | a bundle discount is rendered only from a validated price check against exact contents; otherwise absent | pricing source | WEB-04 |

Unpublished kit pages remain reviewable templates with explicit status; they are never called launched.

---

## 5. Stage 5 — Partners, investors, leadership, resources

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-501 | Partner hub and four partner routes | relationship routing; collaboration distinct from procurement; supplier requirements; acquisition criteria without transaction claims | WEB-03/04/05 | — |
| WB-502 | Investor hub refresh + growth strategy + advanced therapeutics + disclosures | 2025 figures fully scoped (period, unaudited, entity); each therapeutics theme with its own status; no financing amount, listing, or partner claim (S-63) | WEB-05 | WEB-05 |
| WB-503 | Documents index (metadata only) | public / restricted-request / historical; restricted delivery deferred to Stage 6 | Stage 6 | WEB-05/10 |
| WB-504 | Shareholder services | administrative purposes listed; secure follow-up route; no uploads | WEB-05/07 | — |
| WB-505 | Team reconciliation | roster and titles confirmed or dated legacy titles used; John Anderson resolved (S-102); portraits approved | WEB-06 | WEB-06 |
| WB-506 | Newsroom and resource templates | current vs historical vs resources; six resource briefs only with real author/reviewer/date | Stage 6 model | product owner |
| WB-507 | Policy pages | privacy, terms, accessibility reflecting implemented behaviour | privacy/legal review | WEB-07 |

---

## 6. Stage 6 — Governed publishing and document delivery

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-601 | Audit of existing publication foundation | recorded gaps: no editor, no approval action, no audit events, no readers, `effectiveAt`/`expiresAt` only on content items, no storage | BASELINE_AUDIT §3 | — |
| WB-602 | Additive schema changes (§14 needs) | additive migration reviewed and rehearsed under docs/37; not applied as a build side effect | BD-05; Render staging (BLK-02) | WEB-10 |
| WB-603 | Editor / reviewer / approver views under `/public-web` | server-side permission denial for unauthorized edit/approve; validation; preview; publish/unpublish/archive; revision conflict detection; audit events | WB-602 | — |
| WB-604 | Public DTO readers, one family at a time (news → documents → metrics → contacts → pages) | published, effective, non-expired only; archived excluded; generic 503 on failure; static fallback only under an explicit eligibility policy | WB-603 | — |
| WB-605 | Document delivery | object storage decision (BLK-07 / DEC-03); approved public files readable; restricted files never at a guessable URL; request route for restricted | DEC-03 | WEB-10 |
| WB-606 | Cache and withdrawal behaviour | withdrawn/expired content not resurrected; revalidation design proposal (signed events out of scope unless approved) | WB-604 | — |

---

## 7. Stage 7 — Inquiry capture and handoffs

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-701 | Inquiry contract (§15) approved | schema, retention, owners, delivery, abuse controls, audit scope signed off before any form goes live | WEB-07 | WEB-07 |
| WB-702 | Intake endpoint + persistence | one durable record per valid submission; refresh/retry does not duplicate; invalid/abusive requests fail safely; failed storage never shows success | WB-602 (`PublicInquiry`) | — |
| WB-703 | Assignment and staff queue | server-controlled owner mapping; unauthenticated visitors cannot read the queue; status and dedupe | WB-702 | WEB-07 |
| WB-704 | Acknowledgment and notification delivery | separate deliveries with status/retry; tested in a controlled sink; sending stays behind existing approval | RESEND configuration; approval | existing external-send controls |
| WB-705 | Forms | dynamic intent fields; consent copy; newsletter choice separate; accessible errors; no PII in analytics or query strings | WB-701 | privacy review |

---

## 8. Stage 8 — Operating-site integration and measurement

| ID | Item | Acceptance | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| WB-801 | `OPERATING_SITE_HANDOFFS.md` | per-site placements, copy, destinations, owner, status (proposed/implemented/verified) | WB-307 | WEB-08 |
| WB-802 | Apply authorized external changes | only through each site's own admin/repo; verified independently | admin access per site | WEB-08 |
| WB-803 | Analytics taxonomy and consent | events per guide (§Stage 8) with non-sensitive parameters; server-confirmed submission event | privacy posture | WEB-07 |
| WB-804 | Optional read-only product projection | store/SKU/pack/currency/region/availability/URL/update-time mapping; explicit stale behaviour | channel approval | commerce owner |

---

## 9. Stage 9 — SEO, accessibility, migration, release verification

| ID | Item | Acceptance | Dependencies |
| --- | --- | --- | --- |
| WB-901 | Legacy keep/redirect/archive map executed | all 21 legacy URLs handled; `/contact-2/` and `/ross-jelveh/` redirects; `/mike-gill` trailing-slash verified | ROUTE_AND_ACTION_MAP §4 |
| WB-902 | Metadata, canonical, sitemap, robots, social previews, structured data | valid; preview/draft/confirmation routes noindex | Stages 2–8 |
| WB-903 | Public not-found | inside the public shell | — |
| WB-904 | Full journey and browser verification at 320/375/390/768/1440 | recorded per guide; accepted deferrals listed (incl. D-07 if retained) | — |
| WB-905 | Baseline defects BD-01–BD-06 resolved or explicitly deferred | — | — |
| WB-906 | `RELEASE_CANDIDATE.md` against the exact candidate commit | — | docs/37 |

---

## 10. Stage 10 — Authorized cutover

| ID | Item | Acceptance | Dependencies |
| --- | --- | --- | --- |
| WB-1001 | Launch package | candidate commit, green checks, approved content set, domain proposal, migration status, owners, backup/rollback, monitoring, prior deployment reference | Stage 9; DEC-12 |
| WB-1002 | Domain cutover `lifesupplyhealth.com` → Vercel | HTTPS, canonical host, indexing, external destinations, documents, inquiry delivery, Render login verified; rollback available | existing release gates; `PUBLIC_SITE_HOSTS` set |
| WB-1003 | Stabilization record | dated observations and owners | — |

---

## 11. Brand registry design (Stage 2)

```ts
type BrandKey = "corporate" | "lifesupply" | "wellmart" | "clinics" | "balkowitsch" | "command_center";

interface BrandRecord {
  key: BrandKey;
  name: string; // display name
  legalEntity: string | null; // null until WEB-01 confirms
  relationship: "corporate" | "operated_by_group_entity" | "related" | null; // never inferred from a label
  canonicalUrl: string; // https, no tracking parameters
  country: "CA" | "US";
  currency: "CAD" | "USD" | null;
  purpose: string;
  supportUrl: string | null; // verified store contact page
  supportPhone: string | null;
  supportEmail: string | null;
  asset: { src: string; width: number; height: number; source: string; usage: string } | null;
  source: string; // register row IDs
  owner: string | null;
  verifiedAt: string; // ISO date of the last HTTP check
  publishStatus: "published" | "draft";
  availability: "operating" | "pilot" | "in_development" | "under_evaluation" | "unavailable";
}
```

A unit test asserts every `canonicalUrl` is HTTPS, carries no query string, and matches the verified list; a canary asserts public components never build a store URL by string concatenation.

## 12. Route and action registry design (Stage 2)

```ts
interface RouteRecord {
  path: `/${string}/`;
  stage: 2 | 3 | 4 | 5 | 6 | 7 | 9;
  status: "live" | "proposed" | "redirect";
  audience: string[];
  template: string;
  primaryAction: ActionKey;
  navGroup?: "businesses" | "clinic" | "metabolic" | "partners" | "investors" | "about" | "utility";
}

interface ActionRecord {
  key: ActionKey;
  label: string;
  intent: InquiryIntent | "navigation" | "commerce" | "staff";
  destination: { kind: "internal"; path: string } | { kind: "external"; url: string } | { kind: "mailto" | "tel"; value: string };
  ownerChannel: string | null;
  verifiedAt: string | null;
}
```

Navigation is derived from `RouteRecord`s with `status: "live"`; proposed routes never reach a menu.

## 13. Availability and publication model (Stages 4–6)

Two independent statuses on every content record and every kit configuration:

| Axis | Values | Source of truth |
| --- | --- | --- |
| Publication | `draft → under_review → approved → published → archived` | existing `PublicContentStatus` |
| Business availability | `operating`, `pilot`, `in_development`, `under_evaluation`, `unavailable` | new field (Stage 6 additive column or `payload` key until then) |

Kit configuration record (content-side until Stage 6): `id`, `slug`, `label`, `audience[]`, `purpose`, `items[] { name, role: "starter" | "consumable" | "occasional", quantity | null, compatibility[], exclusions[] }`, `store: BrandKey | null`, `destinationUrl | null` (verified category or SKU), `bomRevision`, `availability`, `publication`, `sourceRefs[]`, `reviewer | null`, `effectiveAt | null`. Rendering rule: a kit with `availability !== "operating"` or `destinationUrl === null` renders the information/inquiry action only.

Public metric record needs: `period`, `currency`, `entityScope`, `definition`, `source`, `accountingStatus` ("unaudited"). The existing `PublicMetricSnapshot` covers `periodLabel`, `basis`, `disclosureText`, `sourceReference`; `currency` and `entityScope` are missing and belong in the Stage 6 additive migration or `basis`.

## 14. Schema needs recorded for Stage 6 (not implemented)

- `PublicContentItem`: `audience` (string[]), `availability` (enum), `reviewerId`, `revision` (int), `relatedBrands` (string[]), `metadata` (Json); `effectiveAt`/`expiresAt` extended to documents, metrics, and contacts.
- `PublicDocument`: `accessClass` (`public` | `restricted_request` | `historical`), `version`, `effectiveAt`, `storageProvider`, checksum; storage decision (DEC-03).
- New `PublicInquiry` (Stage 7): see §15.
- Audit: reuse the existing audit-log helper with event types `public_content.published`, `.unpublished`, `.archived`, `public_document.replaced`, `public_metric.changed`, `public_inquiry.received`, `.assigned`, `.delivered`, `.failed`.

## 15. Inquiry contract (Stage 7; specification only)

Request (validated server-side, length-limited, origin-checked, rate-limited):

```ts
interface InquiryRequest {
  intent: "clinic_development" | "equipment_quote" | "ongoing_procurement" | "metabolic_program" | "pharmacy" | "supplier" | "investor" | "shareholder" | "acquisition" | "general" | "existing_order_support";
  sourceBrand: BrandKey;
  sourcePath: string;
  contact: { name: string; email: string; phone?: string; organization?: string; region?: string };
  fields?: Record<string, string>; // intent-specific, allowlisted per intent
  consent: { serviceResponse: true; marketing?: boolean }; // marketing separate
  campaign?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
  idempotencyKey: string; // client-generated, server-checked for retries
}
```

Persisted `PublicInquiry`: request fields plus `receivedAt`, `assignedTo` (server-mapped owner, never from the browser), `status` (`received` | `assigned` | `in_progress` | `closed` | `spam`), `acknowledgment` and `notification` delivery states with attempts, `retentionUntil`, and audit references. `existing_order_support` is never persisted here; it links to the originating store. No file uploads, no health, prescription, identity, or certificate data.

## 16. Decisions required, in the order the stages hit them

| Order | Decision | Blocks | Safe interim |
| --- | --- | --- | --- |
| 1 | S-120 positioning copy and WEB-02 metric policy | WB-204 | render approved figures only |
| 2 | WEB-01 entities, addresses, Balkowitsch and Clinics relationships | WB-201, WB-302 | `null` relationship, approved names |
| 3 | WEB-08 brand-asset files and owners | WB-207 | text-only brand cards |
| 4 | WEB-03 Clinics partners, projects, imagery | WB-304 | services as described on the Clinics site, verified links |
| 5 | WEB-04 kit contents, SKUs, refill capability | WB-402–405 | information/inquiry pages |
| 6 | WEB-05/06 investor narrative, documents, roster | WB-502–505 | qualified 2025 context; dated titles |
| 7 | DEC-03/BLK-07 storage; WEB-10 migration approval | WB-602, WB-605 | metadata-only index |
| 8 | WEB-07 inquiry owners, retention, consent | WB-701 | directory and `mailto:` |
| 9 | DEC-12 deployment promotion | WB-1001 | none: every merge is live |
