# 23 — Integration Certification Workbook

**Project:** LifeSupply Command Center
**Phase:** 11D — Integration certification and data reconciliation
**Prepared:** August 5, 2026
**Status:** Certification procedures ready for staging execution. **No integration is certified yet.** Every sheet in this workbook is unsigned until the accountable person executes it in staging and the product owner records acceptance in `docs/RELEASE_READINESS_STATUS.md`.

---

## 1. Purpose and how to use this workbook

This workbook is the execution plan for register rows 11D-01 … 11D-20. Each integration gets:

1. **Automated evidence** — tests and guards that run in CI on every commit. These prove code posture (read-only scope, suppression precedence, terminal-state tooling) and cannot regress silently.
2. **A staging procedure** — numbered steps the accountable person runs against sandbox/read-only credentials in the provisioned staging environment (`docs/21_STAGING_ENVIRONMENT_GUIDE.md`).
3. **A certification sheet** — the signable record (§10 template) capturing test date, credential environment, records tested, discrepancies, and disposition.

Rules of engagement, restated from docs/20 §11D:

- Sandbox or read-only credentials only, supplied through approved environment configuration. No credential values are ever recorded in this workbook or the register.
- No write scopes, no campaign sends, no supplier order submission, no mutation of any source system.
- Automated evidence is labelled **[CI]**; staging evidence still required is labelled **[STAGING]**. A row is not certifiable on [CI] evidence alone.

Open decisions this phase depends on (recorded, **not** assumed — docs/RELEASE_READINESS_STATUS.md §9):

| Decision | Blocks | What is needed |
|---|---|---|
| `DEC-05` | 11D-01, 11D-02 | The three authoritative BigCommerce stores and credential owners |
| `DEC-06` | 11D-10 | QuickBooks staging mode: sandbox company vs restricted read-only production |
| `DEC-07` | 11D-07, 11D-09, 11D-15 | GA4 property IDs and Mailchimp audience IDs (incl. a non-customer staging audience) |
| `DEC-13` | 11D-04, GATE-03 | Acceptable reconciliation tolerance (§9 presents options) |
| `DEC-14` | 11D-17 | Whether live supplier-portal read-only testing is authorised, and by whom |

---

## 2. Credential environments

| Integration | Staging credential type | Where configured | Never |
|---|---|---|---|
| BigCommerce | Read-scope API token per store | `/admin/integrations` vault or env | Production tokens with write scopes |
| Mailchimp | API key + **staging audience id** (DEC-07) | `/admin/integrations` | The production customer audience id |
| QuickBooks | Sandbox company OAuth (or DEC-06 alternative) | OAuth connect flow from staging | Write-scope grants (code requests `com.intuit.quickbooks.accounting` only) |
| GA4 | Service-account JSON, Viewer role | `/admin/integrations` | Editor/Admin roles on the property |
| Supplier portal | Read-only portal account (DEC-14) | Encrypted vault | Ordering-enabled accounts |

Staging and production must never share credentials, per the isolation matrix in `docs/21` §1.

---

## 3. BigCommerce certification (rows 11D-01 … 11D-06)

### Automated evidence [CI]

- Store↔connection mapping is an explicit FK (`IntegrationConnection.storeId`) with admin-visible "Not mapped" warnings at `/admin/integrations` (`store-mapping.test.ts`).
- Pure mappers for customers, guests, orders, order items, products, variants, categories, and shipments each carry unit tests (`src/server/integrations/bigcommerce/sync/*-mapper.test.ts`, `guest-customer.test.ts`).
- Reconciliation math is pure and tested (`reconciliation-evaluator.test.ts`).
- Terminal-state tooling for GATE-02 (§8).

### Staging procedure [STAGING]

1. **Mapping (11D-01).** After DEC-05 names the stores: create/confirm one `IntegrationConnection` per store, set the store mapping at `/admin/integrations`, and screenshot the mapped state. No connection may show "Not mapped".
2. **Incremental first, then full (11D-02).** For each store, dispatch `customers.incremental`, then `orders.incremental`, then `products.incremental`; confirm terminal `success` in the Automation Center sync log. Then run the controlled `*.full` syncs one store at a time. Record every sync-log row id on the certification sheet.
3. **Field validation (11D-03).** For 10 customers, 10 orders, and 10 products per store, compare Command Center values field-by-field against the BigCommerce control panel: source IDs, email, names, statuses, currency, totals, item SKUs/quantities/prices, variant options, category assignment, shipment carrier/tracking, refund amounts. Record each mismatch with both values.
4. **Reconciliation (11D-04).** Run the reconciliation workflow (`/admin/reconciliation`) per store for (a) a recent full day and (b) the last closed calendar month. The report compares Command Center aggregates against live BigCommerce API values for order counts, revenue, refunds, item units, and lifetime customer/product/order counts. Discrepancies must be within the DEC-13 tolerance (§9) or individually explained on the sheet. This is launch gate **GATE-03** input.
5. **Spot-check ≥25 orders per store (11D-05).** Use the §10 sheet's spot-check table. The sample must include at least one each of: guest checkout, multi-item, cancelled, partially refunded, fully refunded, and shipped order. Verify header totals, line items, fulfillment state, and refund amounts against the control panel.
6. **API behaviour (11D-06).** Record, per full sync: wall-clock duration, records processed/created/updated/failed (from the sync log), and any rate-limit or transport errors in `errorSummary`. **Known limitation to record on the sheet:** the BigCommerce fetch path (`bcFetch` in each sync module) has no 429/`Retry-After` handling, no retry, and no request timeout — a rate-limited response fails the affected record or sync rather than backing off (finding I-02, §11). Certification records observed behaviour; adding a retry layer is a Phase 11E/post-gate follow-up if staging runs show rate-limit pressure.

---

## 4. Mailchimp certification (rows 11D-07 … 11D-09)

### Automated evidence [CI]

- **State mapping (11D-07).** `member-mapper.test.ts` proves every Mailchimp member state maps to the documented consent patch: `subscribed` (clears suppression), `unsubscribed`, `cleaned`, `pending`, `transactional`, `archived`/unknown (no change), and abuse complaints → `complained`.
- **Suppression precedence (11D-08).** Three layers, all CI-enforced:
  1. `evaluateMarketingEligibility` returns `suppressed` for every status in `SUPPRESSED_CONSENT_STATUSES` even against express consent + recent purchase (`marketing-eligibility.test.ts`, "suppression always wins").
  2. Reactivation candidate queries exclude suppressed statuses at the query level, using the **same shared constant** (drift between the two lists was closed this phase).
  3. **Export-time re-check (new this phase):** `exportCampaignToMailchimp` re-reads current consent for every snapshot recipient and drops anyone suppressed, archived, or missing since approval — suppression wins at the last egress point, not only at draft time (`partitionSnapshotByCurrentConsent`, tested per-status; wired-ness enforced by `chokepoints.test.ts`).
  4. The export never auto-sends: campaigns land in Mailchimp as **drafts**; an actual send call appearing in the export path fails CI (`chokepoints.test.ts`).
- `mailchimp.send` defaults OFF, is kill-switch covered, and high-risk-ON fails the staging smoke workflow.

### Staging procedure [STAGING]

1. **Audience mapping (11D-07).** After DEC-07: configure the API key and the **staging audience id**, run the member sync against the staging audience, and validate at least two members in each state (subscribed / unsubscribed / cleaned / pending) map to the expected `consentStatus`, `suppressionReason`, and `suppressedAt` on the Customer record.
2. **Negative-path proof (11D-08).** In the staging audience: subscribe a test address, draft + approve a campaign containing it, then unsubscribe the address in Mailchimp and sync. Export the campaign and verify from the audit row (`campaign.mailchimp_export_queued` → `droppedByReason.suppressed ≥ 1`) that the address was dropped at export time.
3. **Staging audience only (11D-09).** Record on the sheet: the staging audience id used, confirmation the production audience id was never configured in staging, and the `mailchimp.send` flag state (must be exercised via approval flow in staging only; remains OFF in production scope §7.2 of the register).

---

## 5. QuickBooks certification (rows 11D-10 … 11D-14)

### Automated evidence [CI]

- **No write scope (11D-14).** `qbo-read-only.test.ts` enforces: the OAuth request carries exactly `com.intuit.quickbooks.accounting` (no payments/payroll scopes anywhere in the integration); the only non-GET request in the QBO integration is the OAuth token exchange; every accounting-API URL in `src/` is a `/reports/…` read; and `QUICKBOOKS_WRITEBACKS` has zero enforcement call sites — because no write path exists. Any future write path fails CI until consciously gated.
- Report extraction is pure and tested (`report-extractor.test.ts`).
- CSV import fallback (`imports/quickbooks.ts`) writes sync logs and preserves source references.

### Staging procedure [STAGING]

1. **OAuth (11D-10).** After DEC-06: connect from staging via `/admin/integrations` → QuickBooks connect. Record the credential environment (sandbox company id or the DEC-06 alternative), and screenshot the Intuit consent screen showing the **accounting scope only** as scope evidence. The redirect URI must match the Intuit app registration for the staging host (owner step, §12).
2. **Extraction validation (11D-11).** Run the report sync. For P&L, balance-sheet summary, A/R aging, and A/P aging: place the Command Center figure side-by-side with the same report run natively in QuickBooks for the same period, and record both values per line on the sheet.
3. **Three closed periods (11D-12).** Repeat the comparison for at least three closed monthly periods. Differences must be zero or individually explained (timing, classes, rounding) — QuickBooks is the accounting source of truth, so tolerance here is **stricter** than BigCommerce reconciliation (§9, Option note).
4. **Limitations note (11D-13).** Document on the sheet: class/division dimensions the report API does not expose for this company file, and any figures that therefore remain CSV-import-only.

---

## 6. GA4 certification (rows 11D-15 … 11D-16)

### Automated evidence [CI]

- The GA4 client requests the `analytics.readonly` scope only and calls the Data API `runReport` endpoint (read).
- Metric mapping is pure and tested (`metrics-mapper.test.ts`).

### Staging procedure [STAGING]

1. **Access + mapping (11D-15).** After DEC-07: configure the service-account JSON (Viewer role), map each GA4 property to its store at `/admin/integrations`, run the daily sync, and validate: property id ↔ store mapping, date-range boundaries, timezone (property timezone vs UTC — record which the property uses), currency code, and source/medium aggregation against the GA4 UI's own report for the same range.
2. **30-day reconciliation (11D-16).** For at least 30 consecutive days, compare stored daily sessions/users/revenue metrics against the GA4 interface. GA4 is directional analytics — not an accounting source — so DEC-13 may set a looser tolerance band here (§9). Record daily deltas on the sheet.

---

## 7. Supplier portal certification (rows 11D-17 … 11D-18)

### Automated evidence [CI]

- **Submission disabled (11D-18).** Three independent guards: `supplier.order_submit` defaults OFF (flag tests); `submitSupplierOrder` requires flag + approval and then **unconditionally throws** before any portal write — no live submission path exists in the codebase; and `chokepoints.test.ts` fails CI if the flag/approval gates are removed. The kill switch covers both supplier flags.
- Comparison rules (price/stock/SKU mismatch verdicts) and BBM01 selector handling (including `SelectorNotFoundError` on layout change) are unit-tested.

### Staging procedure [STAGING]

1. **Authorisation first (11D-17).** Do not touch the live portal until DEC-14 records who authorised read-only testing. Until then, run the mock-portal path only.
2. With DEC-14 recorded: run read-only checks against the live portal for a small SKU sample. Verify: login succeeds from the vaulted credential; SKU search finds the product; price and stock capture match the visible portal values; a deliberately wrong expected price triggers a mismatch exception; screenshot evidence is stored and served through the authenticated evidence route; and a selector miss produces the layout-change failure path (not a false success).
3. **Flag evidence (11D-18).** Export the flag state from `/admin/feature-flags` in staging showing `supplier.order_submit` OFF; attach to the sheet.

---

## 8. Sync terminal-state audit (row 11D-20, launch gate GATE-02)

GATE-02: no integration sync may remain indefinitely in `running`.

### Automated evidence [CI]

- New stuck-sync tooling (`src/server/services/sync/stuck-syncs.ts`, tested): a `running` sync log older than **6 hours** is classified stuck. The Automation Center shows a warning card listing stuck runs, and an operator with `admin.manage_integrations` can mark them failed ("reap") — audit-logged, local rows only, never contacting a source system. Reaping re-filters on `status: running` so a run that completes mid-reap is never overwritten.

### Staging procedure [STAGING]

1. Kill the worker mid-sync (or let a deploy interrupt one) so a `running` row is abandoned.
2. After the threshold, confirm the run appears in the Automation Center stuck-sync card; reap it; verify the row reaches `failed` with the stuck-sync error summary and an `sync.stuck_runs_reaped` audit row exists.
3. At the end of the 11D window, run the audit query (the stuck-sync card with zero rows, plus a sync-log listing showing only terminal statuses older than 6h) and attach it as GATE-02 evidence.

---

## 9. Reconciliation tolerances — DEC-13 options (decision required, not assumed)

The code today ships one tolerance, applied uniformly (`reconciliation-evaluator.ts`): a discrepancy is **material** only when it exceeds BOTH an absolute floor and a relative floor.

| Option | Counts | Money | Notes |
|---|---|---|---|
| **A — current code values** | abs ≥ 3 AND ≥ 0.5% | abs ≥ $25 AND ≥ 0.5% | What runs today; no change needed if accepted |
| **B — strict** | abs ≥ 1 AND ≥ 0.1% | abs ≥ $1 AND ≥ 0.1% | Near-exact; expect noise from timing effects (orders created during the run, refunds posted after the window) |
| **C — per-domain** | BigCommerce as A; GA4 looser (e.g. 2%) | QuickBooks **exact-or-explained** (no tolerance); BigCommerce as A | Matches source-of-truth weight: accounting exact, commerce near-exact, analytics directional |

Considerations for the owner: BigCommerce reconciliation runs against a **live** API while Command Center data is sync-time — small timing deltas are structural, which is why Option A has a floor. QuickBooks period reconciliation (11D-12) compares closed periods, where "exact or explained" is achievable and appropriate. GA4 sampling and late-arriving events make sub-1% precision unrealistic.

**Recorded as a dependency:** rows 11D-04 and GATE-03 cannot be dispositioned until DEC-13 is answered. If an option other than A is chosen, updating `TOLERANCES` (and, for Option C, keying it per integration) is a small, tested change.

---

## 10. Certification sheet template (row 11D-19)

Copy one per integration per store/property/audience. A sheet is valid only when every field is filled and the signature line is completed by the accountable person — **an AI agent must never fill the signature or disposition fields.**

```text
INTEGRATION CERTIFICATION SHEET

Integration:                bigcommerce | mailchimp | quickbooks | ga4 | supplier_portal
Scope (store/property/
audience/portal):           ____________________________________________
Test date(s):               ____________________________________________
Credential environment:     sandbox | read-only production | staging audience | mock portal
Credential owner (person):  ____________________________________________
Staging deploy (commit):    ____________________________________________

Records tested:
  Sync-log row ids:         ____________________________________________
  Entities validated:       __ customers  __ orders  __ products  __ reports  __ members  __ SKUs
  Spot-check table:         attached: yes / no  (BigCommerce: ≥25 orders incl. guest,
                            multi-item, cancelled, partial refund, full refund, shipped)

Reconciliation:
  Ranges reconciled:        ____________________________________________
  Tolerance applied:        DEC-13 option: ____
  Material discrepancies:   count: ____  (each listed + explained below)

Discrepancies and dispositions:
  1. ________________________________________________________________
  2. ________________________________________________________________

API behaviour observed (duration, failures, rate limiting):
  ____________________________________________________________________

Disposition:                certified | certified with noted limitations | failed — remediation required
Signed (name / role / date): ___________________________________________
```

---

## 11. Findings and observations (Phase 11D)

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| I-01 | — (closed) | Campaign export trusted the frozen audience snapshot; a customer suppressed between approval and export would still have been exported | **Fixed this phase** — export-time consent re-check, per-status tests, chokepoint canary |
| I-02 | Medium | BigCommerce fetch path has no 429/`Retry-After` handling, retry, or request timeout; rate-limit pressure fails records/syncs instead of backing off | Record observed behaviour during 11D-06; implement backoff in Phase 11E if staging shows pressure |
| I-03 | Low | Suppressed-status list was duplicated in `marketing-eligibility.ts` and `reactivation.ts` (drift risk) | **Fixed this phase** — single exported constant, drift test added |
| I-04 | Low | Abandoned `running` sync logs were indistinguishable from live work (GATE-02 risk) | **Fixed this phase** — stuck-sync audit + operator reap tooling |
| I-05 | Low | `IntegrationSyncLog` has no `storeId` column; store attribution relies on `metadata.storeId` and the connection FK | Acceptable for 11D (certification groups by connection); revisit if per-store sync SLAs are needed |
| I-06 | Info | `QUICKBOOKS_WRITEBACKS` flag exists with zero call sites | By design — no write path exists; canary now enforces this |
| I-07 | Info | BigCommerce HTTP layer (`bcFetch`) is private per-module with no injection seam, so API-level behaviour (retry, 429) is not unit-testable | Certification records live behaviour instead; refactor only if I-02 remediation lands |

---

## 12. Steps only the product owner (or named humans) can perform

1. **Decide DEC-05** — name the three authoritative BigCommerce stores and their credential owners.
2. **Decide DEC-06** — QuickBooks sandbox company vs restricted read-only production; register the staging redirect URI in the Intuit developer app.
3. **Decide DEC-07** — GA4 property ids; Mailchimp audience ids including a non-customer **staging** audience.
4. **Decide DEC-13** — pick a reconciliation tolerance option from §9.
5. **Decide DEC-14** — authorise (or decline) live supplier-portal read-only testing, in writing.
6. Provision staging per `docs/21` (blocker BLK-01) — every [STAGING] item above depends on it.
7. Create and vault the staging credentials listed in §2; never reuse production secrets.
8. Execute (or delegate to the accountable roles) the [STAGING] procedures in §3–§8 and fill the §10 sheets.
9. Sign each certification sheet and record row dispositions in `docs/RELEASE_READINESS_STATUS.md` — only the product owner records acceptance.
