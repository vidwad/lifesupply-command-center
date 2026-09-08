# Stage 1 — Route and Action Map

**Prepared:** September 8, 2026, against `main` at `148617e`. Every route in guide §3 is listed, plus every route that exists today. "Status" is the state at this commit, not a promise. Destinations marked **verified** returned HTTP 200 on 2026-09-08 (see `SOURCE_REGISTER.md` §1 and §7); anything else is **proposed** and must not ship as a live link.

## 1. Brand registry (seed)

The typed registry Stage 2 implements. Unknown values stay unknown in code (`null`), never guessed.

| key | Brand | Canonical URL | Country / currency | Purpose | Support destination (verified) | Legal relationship | Asset | Verification date | Publish status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `corporate` | LifeSupply Health | `https://lifesupplyhealth.com/` (target); alias in force `https://lifesupply-command-center-vidwads-projects.vercel.app/` | CA / — | corporate hub | `mailto:info@lifesupply.com` | LifeSupply Health Supplies Inc. (approved name) | `/lsh/lifesupply-mark.png` | 2026-09-08 | published (alias) |
| `lifesupply` | LifeSupply | `https://lifesupply.ca/` | CA / CAD | broad Canadian ecommerce; proposed clinic-procurement emphasis | `https://lifesupply.ca/contact/`, 1-855-755-5433 | operated by Wellmart Health Supplies Ltd., "a division of" the corporate entity (store statement S-10; owner confirmation pending WEB-01) | not held | 2026-09-08 | operating |
| `wellmart` | Wellmart Medical | `https://wellmartmedical.com/` | CA / CAD | Canadian medical-supply ecommerce; proposed home-care emphasis | `https://wellmartmedical.com/contact-us/`, `info@wellmartmedical.com` | "a division of" the corporate entity (S-12; pending WEB-01) | not held | 2026-09-08 | operating |
| `clinics` | LifeSupply Clinics | `https://www.lifesupplyclinics.com/` | CA (BC) / CAD | clinic planning, design, construction/fit-out, project coordination, equipment inquiries | `https://www.lifesupplyclinics.com/contact-us/`, `info@lifesupplyclinics.com` | entity not stated (S-16); delivery partners unnamed (S-72) | not held | 2026-09-08 | operating (site); services within verified arrangements |
| `balkowitsch` | Balkowitsch Worldwide | `https://balkowitsch.com/` | US / USD | U.S. ecommerce, broad catalogue | `https://balkowitsch.com/contact-us/`, (800) 355-2956, `sales@balkowitsch.com` | not stated (S-15); do not assert | not held | 2026-09-08 | operating |
| `command_center` | Internal Command Center | `getCommandCenterLoginUrl()` → Render `/login?redirectTo=/dashboard` | — | staff login | — | internal | — | 2026-09-08 | utility link only; never a hero action |

## 2. Action registry (intent → destination)

| Action key | Label (working) | Intent | Destination today | Destination after Stage 7 | Owner (to confirm, WEB-07) |
| --- | --- | --- | --- | --- | --- |
| `explore_businesses` | Explore our businesses | navigation | `/our-operations/` (exists) | same | — |
| `plan_clinic` | Plan a clinic | clinic development | **verified** `https://www.lifesupplyclinics.com/contact-us/` | `/contact/?intent=clinic_development` intake | Clinics owner |
| `equipment_quote` | Request an equipment plan or quote | equipment quote | **verified** `https://www.lifesupplyclinics.com/buy-clinic-equipment/` | intake | Clinics / showroom (Mike Gill, S-26) |
| `clinic_supply_review` | Request a clinic supply review | ongoing procurement | `mailto:ben@lifesupply.com` (approved channel S-27) | intake | Online sales (Ben Hastibakhsh) |
| `discuss_program` | Discuss a supply program | metabolic / pharmacy | `mailto:info@lifesupply.com` | intake | unassigned (WEB-07) |
| `shop_lifesupply` | Shop LifeSupply | commerce | **verified** `https://lifesupply.ca/` | same | store |
| `shop_wellmart` | Shop Wellmart | commerce | **verified** `https://wellmartmedical.com/` | same | store |
| `shop_balkowitsch` | Shop Balkowitsch | commerce (USD) | **verified** `https://balkowitsch.com/` | same | store |
| `us_business_inquiry` | U.S. business inquiry | strategic | `mailto:info@lifesupply.com` | intake | unassigned |
| `supplier_inquiry` | Submit supplier inquiry | supplier | `mailto:info@lifesupply.com` | intake | unassigned |
| `investor_materials` | Request investor materials | investor | `mailto:invest@lifesupply.com` (approved) | intake + Stage 6 restricted-document request | Investor relations |
| `shareholder_services` | Shareholder services | shareholder | `mailto:invest@lifesupply.com` | secure follow-up route | Investor relations |
| `acquisition_inquiry` | Acquisition / strategic transaction | M&A | `mailto:abdul@lifesupply.com` (approved channel) | intake | Abdul Ladha |
| `existing_order_support` | Existing order support | store support | the originating store's contact page (verified per store) | unchanged (never routed through the corporate site) | store |
| `command_center_login` | Command Center login | staff | `getCommandCenterLoginUrl()` | unchanged | — |

Every primary action on a live page must resolve to a "today" destination in this table. `mailto:` destinations are acceptable interim actions because they are verified channels already published; a form that does not persist is not.

## 3. Route map

Columns: **Status** = live / alias / proposed / redirect-proposed; **Stage** per guide §3; **Template** = existing primitive or a Stage 2 template to build; **Source** = where copy comes from at that stage.

### 3.1 Shell and top-level

| Route | Status | Stage | Audience | Template | Primary action → destination | Content source | Owner | Dependencies | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | live | 2 | all | `PublicHero` (video), `InfoBand`, pillars, metrics, brand cards, overview → Stage 2 home contract | `explore_businesses`; `plan_clinic`; `investor_materials` | `homepage`, registry | product owner | S-120 positioning review; brand assets (S-135) | four brands visible with verified links; no unapproved metric; clinic and investor paths present; one h1; mobile nav complete |
| `/about-us/` | live | 2 | all | hero, mission/vision, brand cards, lockup band → Stage 2 about contract (footprint, sourced milestones, philosophy, growth direction) | `explore_businesses` | `about`, registry | product owner | milestones need dated sources (S-133 is not one) | no legacy-only claim revived; growth direction qualified |
| `/our-operations/` | live (list + timeline image) | 3 | all | portfolio map (brands vs entities vs capabilities vs programmes) | explore a business | `operations`, registry | product owner | WEB-01 | brand/entity distinction explicit; timeline text in HTML or the image labelled historical (D-08) |
| `/our-team/` | live | 5 | all | team grid + board | view profile | `team` | product owner (WEB-06) | roster confirmation, portraits | historical vs current labelled; no invented director |
| `/[slug]/` (13 legacy profiles) | live | 5 | all | `LegacyProfilePage` | return to team | `team.legacyProfiles` | WEB-06 | — | preserved URLs; dated |
| `/investor-relations/` | live | 5 | investors | hero, deck window, 2025 figures, disclosure, contact | `investor_materials` | `investorRelations` | investor relations (WEB-05) | S-64 deck date | metrics scoped or omitted; no financing/listing claim |
| `/news/` | live (4 historical items) | 5, 6 | all | list → newsroom template (current vs historical vs resources) | read source | `news` → Stage 6 DTO `news_item` | — | Stage 6 | truthful dates; historical label |
| `/contact/` | live (directory) | 3, 7 | all | directory + intent routing → Stage 7 intake | `mailto:`/`tel:` today | `contact.channels` | WEB-07 | Stage 7 contract | no fake form; every channel verified |
| `/contact-2/` | live duplicate (D-05) | 9 | — | — | — | — | — | trailing-slash behaviour check | 301 → `/contact/` |
| `/shop/` | live (boundary page) | 3 | shoppers | Shop & Services: four choices with geography/currency/support | `shop_*` | registry | commerce owner | brand assets | geography and currency stated; support boundaries; keep URL |
| `/privacy/`, `/terms/`, `/accessibility/` | proposed (legacy 404 too) | 5, 7 | all | policy template | — | reviewed policies | privacy/legal | Stage 7 collection design | accurate to implemented behaviour |
| submission confirmation | proposed | 7 | — | confirmation template, `noindex` | next step | — | WEB-07 | Stage 7 | no submitted data in URL |
| `not-found` | proposed | 9 | all | public not-found | home / contact | — | — | — | useful recovery inside the public shell |

### 3.2 Our Businesses (Stage 3)

| Route | Status | Audience | Template | Primary action → destination | Content source | Dependencies | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/our-operations/lifesupply/` | proposed | clinics, institutions, consumers | brand page (categories, audience, channels, support) | `shop_lifesupply` → verified `https://lifesupply.ca/`; `clinic_supply_review` | registry; S-80–S-84 category links | WEB-01, brand asset | verified canonical link; clinic-procurement direction stated as emphasis, not restriction |
| `/our-operations/wellmart-medical/` | proposed | home-care buyers, professionals | brand page | `shop_wellmart` → verified `https://wellmartmedical.com/` | registry; S-85–S-87 | WEB-01, asset | "do not imply professional buyers are excluded" |
| `/our-operations/lifesupply-clinics/` | proposed | clinic owners, practitioners | brand page + process + projects | `plan_clinic` → verified Clinics contact; `equipment_quote` → verified quote page | S-70–S-75 | WEB-03 attribution, imagery rights | services described as on the Clinics site; delivery roles stated; no owned-clinic implication; post-opening supply opportunity conditional |
| `/our-operations/balkowitsch/` | proposed | U.S. buyers, partners | brand page | `shop_balkowitsch` → verified; `us_business_inquiry` | registry; S-24, S-88 | WEB-01 (relationship), asset | USD stated; identity preserved; no subsidiary assertion |
| `/our-operations/technology-fulfilment/` | proposed | clinics, partners | capability page (implemented vs developing) | `clinic_supply_review` | Command Center capabilities described only as management systems; no operational data | product owner | implemented vs developing labelled honestly |

### 3.3 Clinic Solutions (Stage 3)

| Route | Status | Audience | Template | Primary action → destination | Dependencies | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| `/clinic-solutions/` | proposed | clinic owners at three stages | three-need hub (plan/renovate, equip, supply an existing clinic) | routes by need to the three children | WEB-03 | an existing clinic can reach supply without construction |
| `/clinic-solutions/design-build/` | proposed | planning a clinic | corporate intro + geography (BC observed) + delivery roles + consultation requirements | `plan_clinic` → verified Clinics contact | WEB-03 | deep-link only to the verified consultation page |
| `/clinic-solutions/equipment/` | proposed | equipping a clinic | room/function planning, quote requirements, opening supplies, catalogue links | `equipment_quote` → verified quote page; category links S-80 | WEB-03/04 | no invented equipment lists or prices |
| `/clinic-solutions/ongoing-supplies/` | proposed | operating clinics | procurement, account purchasing, substitutions, repeat ordering "as available" | `clinic_supply_review` | store account facts (S-52) | claims limited to what the stores actually offer |

### 3.4 Metabolic Health (Stage 4)

| Route | Status | Audience | Template | Primary action → destination | Dependencies | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| `/metabolic-health/` | proposed | clinics, pharmacies, programme sponsors | division hub: non-drug supplies, procurement, kitting/fulfilment, contracted workflow support; availability status | explore kits; `discuss_program` | WEB-04 | actual availability stated; no drug, dosing, or dispensing implication |
| `/metabolic-health/care-kits/` | proposed | as above | kit hub (eight pathways; starter/refill/occasional; availability; action) | per-kit | WEB-04 | all eight represented; no purchasable placeholder |
| `/metabolic-health/care-kits/glp-1-support/` (K01) | proposed | patients' clinics/pharmacies | kit template | `discuss_program` (no approved SKU) | contents, device compatibility | medication excluded; device-specific |
| `…/injection-safety/` (K02) | proposed | | kit template | `discuss_program`; S-81/S-85 category links as "browse" only | contents | no universal-syringe claim |
| `…/sharps-supplies/` (K03) | proposed | | kit template | `discuss_program` | **no verified category URL (S-89)** | region-fit disposal guidance only when sourced |
| `…/travel-support/` (K04) | proposed | | kit template | S-84 first-aid links as browse only | contents | occasional purchase; storage claims only for exact products |
| `…/home-monitoring/` (K05) | proposed | | kit template | S-83/S-86/S-88 browse links | sizing/compatibility | no treatment interpretation |
| `…/diabetes-supplies/` (K06) | proposed | | kit template | S-82/S-86 browse links | meter/strip compatibility | actual refill requirements |
| `…/clinic-injectable-supplies/` (K07) | proposed | clinics | kit template (par-level restocking) | `clinic_supply_review`; S-80/S-81 | clinic configurations | not one universal pack |
| `…/pharmacy-patient-support/` (K08) | proposed | pharmacies | kit template | `discuss_program` | pharmacist selection, fulfilment responsibilities | explicit responsibilities |
| `/metabolic-health/refills/` | proposed | participants, clinics | refills information (starter vs consumables; reminder vs automatic; intervals, pauses, cancellation, substitutions) | `discuss_program` | actual refill capability (WEB-04) | service claims only when supported |

### 3.5 Partners and investors (Stage 5; documents Stage 6)

| Route | Status | Audience | Template | Primary action → destination | Dependencies | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| `/partners/` | proposed | clinics, pharmacies, suppliers, acquirers | relationship router | by relationship | — | routes distinct from procurement |
| `/partners/clinics/` | proposed | programme/design partners | collaboration page | `plan_clinic` variant → intake later | WEB-03 | pilots differentiated from ordinary procurement |
| `/partners/pharmacies/` | proposed | pharmacies | supply-programme page | `discuss_program` | WEB-04 | complaints/recalls responsibilities stated |
| `/partners/suppliers/` | proposed | suppliers/manufacturers | onboarding page | `supplier_inquiry` | commercial process owner | categories/regions/data requirements |
| `/partners/acquisitions/` | proposed | targets, strategic/public-market counterparties | criteria + confidential process | `acquisition_inquiry` | WEB-05 | no transaction announced |
| `/investor-relations/growth-strategy/` | proposed | investors | dated stage/milestone view | `investor_materials` | WEB-05 | qualified, dated |
| `/investor-relations/advanced-therapeutics/` | proposed | investors | individually-defined status per theme (pharmacy, compounding, peptide synthesis/research, manufacturing) | strategic inquiry | WEB-05; regulatory review | each theme's status and dependencies separate |
| `/investor-relations/documents/` | proposed | investors | index (public / restricted-request / historical; title, date, version, status) | request restricted → `investor_materials` | Stage 6 `PublicDocument` + storage (BLK-07) | restricted files never at a guessable public URL |
| `/investor-relations/shareholder-services/` | proposed | shareholders | administrative queries | `shareholder_services` (secure route later) | WEB-05/07 | no certificate/identity uploads |
| `/investor-relations/disclosures/` | proposed | investors | approved financial and forward-looking context | — | WEB-05 | tied to actual published materials |
| `/news/[slug]/` | proposed | all | dated announcement template | — | Stage 6 | original dates preserved |
| `/resources/[slug]/` | proposed | clinics, pharmacies | resource template (author/reviewer, dates, action) | relevant action | Stage 5 briefs, Stage 6 model | no fabricated authors or dates |

### 3.6 Navigation contract (Stage 2)

Primary: **Our Businesses / Clinic Solutions / Metabolic Health / Partners / Investors / About**. Utility: **Shop & Services / Contact / Command Center Login**. Footer: four brands, News & Resources, policies. Until a destination exists, its menu entry either is omitted or points at `/contact/` with the matching intent; an internal route map may list the full plan.

## 4. Legacy URL inventory (for Stage 9 keep/redirect/archive)

From the legacy page sitemap (21 URLs) and observed redirects, 2026-09-08:

| Legacy URL | Unified handling today | Stage 9 decision |
| --- | --- | --- |
| `/`, `/about-us/`, `/our-operations/`, `/our-team/`, `/investor-relations/`, `/news/`, `/shop/` | served | keep |
| `/contact-2/` | served (duplicate) | 301 → `/contact/` |
| `/contact/` (legacy 301 → `/contact-2/`) | served | keep as canonical |
| 13 profile slugs incl. `/ross-jelveh-2/`, `/keith-dolo-2/`, `/dr-margaret-clarke-2/`, `/john-anderson-2/`, `/dr-dedeshya-holowenko/` | served by `/[slug]/` | keep; `/ross-jelveh/` (legacy 301) → add redirect |
| `/mike-gill` (no trailing slash) | Next trailing-slash behaviour to verify | verify |
| `/privacy/`, `/terms/` | 404 on both | create in Stage 5/7 |
| `/wp-content/uploads/2022/05/Lifesupply-Investor-Presentation.pdf` | not served | decide: archive or republish as a dated historical document in Stage 6 |
| 49 other `wp-content/uploads` assets | not served | inventory in Stage 9; none is a page |
