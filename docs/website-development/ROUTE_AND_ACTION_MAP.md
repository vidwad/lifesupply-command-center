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

---

## Registry-derived tables (Stage 9 refresh; restructure rows updated 2026-09-08)

**Restructure of 2026-09-08 (product owner):** primary navigation is Medical Supply Solutions / Clinic Solutions / Metabolic Health / Pharmacy Solutions / Partners / Investors / About. Our Businesses became Medical Supply Solutions (three stores; corporate portfolio moved to About); the LifeSupply Clinics brand page and Design & build merged into Clinic Solutions; Technology & fulfilment was withdrawn; the leadership profiles other than Abdul Ladha were withdrawn; Pharmacy Solutions was added as an information section with its status. Actions added: `clinic_equipment`, `clinic_ongoing_supplies`, `pharmacy_hub`; `explore_businesses` relabelled; `clinic_supply_review` now reaches the corporate office. Every withdrawn address is a permanent redirect (`next.config.ts`).

Generated from the registries on September 8, 2026 (Stage 9). Where an earlier section of this document disagrees with these tables, the tables are authoritative: they are the code the site runs. Every `proposed` row from Stages 1 to 5 is now `live` except the redirect and the two publication-model templates, which are live but served from the read model.

### 3a. Route registry (generated from `src/lib/public-site/routes.ts`, Stage 9)

| Path | Label | Stage | Status | Menu group | Route file |
| --- | --- | --- | --- | --- | --- |
| `/` | Home | 2 | live | — | `src/app/page.tsx` |
| `/about-us/` | About us | 2 | live | about | `src/app/about-us/page.tsx` |
| `/medical-supply-solutions/` | Medical Supply Solutions | 3 | live | businesses | `src/app/medical-supply-solutions/page.tsx` |
| `/our-operations/` | Withdrawn address (redirect) | 3 | redirect → `/medical-supply-solutions` | — | `next.config.ts` |
| `/medical-supply-solutions/lifesupply/` | LifeSupply | 3 | live | businesses | `src/app/medical-supply-solutions/lifesupply/page.tsx` |
| `/medical-supply-solutions/wellmart-medical/` | Wellmart Medical | 3 | live | businesses | `src/app/medical-supply-solutions/wellmart-medical/page.tsx` |
| `/our-operations/lifesupply-clinics/` | Withdrawn address (redirect) | 3 | redirect → `/clinic-solutions` | — | `next.config.ts` |
| `/medical-supply-solutions/balkowitsch/` | Balkowitsch Worldwide | 3 | live | businesses | `src/app/medical-supply-solutions/balkowitsch/page.tsx` |
| `/our-operations/technology-fulfilment/` | Technology & fulfilment (withdrawn 2026-09-08, product owner: not a major business unit) | 3 | redirect → `/our-operations` | — | `next.config.ts` |
| `/clinic-solutions/` | Clinic Solutions (the LifeSupply Clinics section since 2026-09-08) | 3 | live | clinic | `src/app/clinic-solutions/page.tsx` |
| `/clinic-solutions/design-build/` | Withdrawn address (redirect) | 3 | redirect → `/clinic-solutions` | — | `next.config.ts` |
| `/clinic-solutions/equipment/` | Equipment | 3 | live | clinic | `src/app/clinic-solutions/equipment/page.tsx` |
| `/clinic-solutions/ongoing-supplies/` | Ongoing supplies | 3 | live | clinic | `src/app/clinic-solutions/ongoing-supplies/page.tsx` |
| `/metabolic-health/` | Metabolic Health | 4 | live | metabolic | `src/app/metabolic-health/page.tsx` |
| `/metabolic-health/care-kits/` | Care kits | 4 | live | metabolic | `src/app/metabolic-health/care-kits/page.tsx` |
| `/metabolic-health/care-kits/glp-1-support/` | glp-1-support | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/injection-safety/` | injection-safety | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/sharps-supplies/` | sharps-supplies | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/travel-support/` | travel-support | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/home-monitoring/` | home-monitoring | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/diabetes-supplies/` | diabetes-supplies | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/clinic-injectable-supplies/` | clinic-injectable-supplies | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/care-kits/pharmacy-patient-support/` | pharmacy-patient-support | 4 | live | — | `src/app/metabolic-health/care-kits/[kit]/page.tsx` |
| `/metabolic-health/refills/` | Refills | 4 | live | metabolic | `src/app/metabolic-health/refills/page.tsx` |
| `/partners/` | Partners | 5 | live | partners | `src/app/partners/page.tsx` |
| `/partners/clinics/` | Clinics | 5 | live | partners | `src/app/partners/clinics/page.tsx` |
| `/partners/pharmacies/` | Pharmacies | 5 | live | partners | `src/app/partners/pharmacies/page.tsx` |
| `/partners/suppliers/` | Suppliers | 5 | live | partners | `src/app/partners/suppliers/page.tsx` |
| `/partners/acquisitions/` | Acquisitions | 5 | live | partners | `src/app/partners/acquisitions/page.tsx` |
| `/investor-relations/` | Investor relations | 5 | live | investors | `src/app/investor-relations/page.tsx` |
| `/investor-relations/growth-strategy/` | Growth strategy | 5 | live | investors | `src/app/investor-relations/growth-strategy/page.tsx` |
| `/investor-relations/advanced-therapeutics/` | Advanced therapeutics | 5 | live | investors | `src/app/investor-relations/advanced-therapeutics/page.tsx` |
| `/investor-relations/documents/` | Documents | 5 | live | investors | `src/app/investor-relations/documents/page.tsx` |
| `/investor-relations/shareholder-services/` | Shareholder services | 5 | live | investors | `src/app/investor-relations/shareholder-services/page.tsx` |
| `/investor-relations/disclosures/` | Disclosures | 5 | live | investors | `src/app/investor-relations/disclosures/page.tsx` |
| `/our-team/` | Our team (one leader since 2026-09-08) | 5 | live | about | `src/app/our-team/page.tsx` |
| `/pharmacy-solutions/` | Pharmacy Solutions | 5 | live | pharmacy | `src/app/pharmacy-solutions/page.tsx` |
| `/news/` | News & resources | 5 | live | about | `src/app/news/page.tsx` |
| `/shop/` | Shop & Services | 3 | live | utility | `src/app/shop/page.tsx` |
| `/contact/` | Contact | 3 | live | utility | `src/app/contact/page.tsx` |
| `/contact-2/` | Contact (legacy) | 9 | redirect | — | ``next.config.ts` redirect` |
| `/privacy/` | Privacy | 5 | live | legal | `src/app/privacy/page.tsx` |
| `/terms/` | Terms of use | 5 | live | legal | `src/app/terms/page.tsx` |
| `/accessibility/` | Accessibility | 5 | live | legal | `src/app/accessibility/page.tsx` |
| `/news/[slug]/` | News item | 6 | live | — | `src/app/news/[slug]/page.tsx` |
| `/resources/[slug]/` | Resource | 6 | live | — | `src/app/resources/[slug]/page.tsx` |

### 5a. Action registry (generated from `src/lib/public-site/actions.ts`, Stage 9)

| Key | Label | Intent | Destination | Owner channel | Verified |
| --- | --- | --- | --- | --- | --- |
| `explore_businesses` | Explore our businesses | navigation | internal `/our-operations/` | — | — |
| `about_group` | About LifeSupply | navigation | internal `/about-us/` | — | — |
| `plan_clinic` | Book a consultation | clinic_development | external `https://www.lifesupplyclinics.com/contact-us/` | info@lifesupplyclinics.com | 2026-09-08 |
| `equipment_quote` | Request an equipment quote | equipment_quote | external `https://www.lifesupplyclinics.com/buy-clinic-equipment/` | info@lifesupplyclinics.com | 2026-09-08 |
| `clinic_supply_review` | Request a supply review | ongoing_procurement | mailto `undefined` | Online sales & product lines | — |
| `clinic_solutions` | Clinic Solutions | navigation | internal `/clinic-solutions/` | — | — |
| `view_clinic_projects` | See published projects | clinic_development | external `https://www.lifesupplyclinics.com/our-projects/` | — | 2026-09-08 |
| `metabolic_hub` | Metabolic Health | navigation | internal `/metabolic-health/` | — | — |
| `explore_kits` | Explore the pathways | navigation | internal `/metabolic-health/care-kits/` | — | — |
| `refills_information` | How refills work | navigation | internal `/metabolic-health/refills/` | — | — |
| `discuss_program` | Discuss a supply program | metabolic_program | mailto `undefined` | — | — |
| `partners_hub` | Explore partner relationships | navigation | internal `/partners/` | — | — |
| `partner_clinics` | Clinic collaboration | navigation | internal `/partners/clinics/` | — | — |
| `partner_pharmacies` | Pharmacy supply programs | navigation | internal `/partners/pharmacies/` | — | — |
| `clinic_collaboration` | Discuss clinic collaboration | partner | mailto `undefined` | info@lifesupply.com | — |
| `growth_strategy` | Growth strategy | navigation | internal `/investor-relations/growth-strategy/` | — | — |
| `advanced_therapeutics` | Advanced therapeutics | navigation | internal `/investor-relations/advanced-therapeutics/` | — | — |
| `investor_documents` | Documents index | navigation | internal `/investor-relations/documents/` | — | — |
| `partner_inquiry` | Start a partner conversation | partner | mailto `undefined` | — | — |
| `supplier_inquiry` | Submit a supplier inquiry | supplier | mailto `undefined` | — | — |
| `us_business_inquiry` | U.S. business inquiry | general | mailto `undefined` | — | — |
| `acquisition_inquiry` | Acquisition or strategic inquiry | acquisition | mailto `undefined` | Mergers & acquisitions | — |
| `general_inquiry` | General inquiry | general | mailto `undefined` | Corporate office | — |
| `investor_information` | Investor relations | investor | internal `/investor-relations/` | Investor relations | — |
| `investor_materials` | Request investor materials | investor | mailto `undefined` | Investor relations | — |
| `shareholder_services` | Shareholder services | shareholder | mailto `undefined` | Investor relations | — |
| `shop_lifesupply` | Shop LifeSupply | commerce | external `https://lifesupply.ca/` | — | 2026-09-08 |
| `shop_wellmart` | Shop Wellmart Medical | commerce | external `https://wellmartmedical.com/` | — | 2026-09-08 |
| `shop_clinics` | Visit LifeSupply Clinics | clinic_development | external `https://www.lifesupplyclinics.com/` | — | 2026-09-08 |
| `shop_balkowitsch` | Shop Balkowitsch Worldwide | commerce | external `https://balkowitsch.com/` | — | 2026-09-08 |
| `shop_services` | Shop & Services | navigation | internal `/shop/` | — | — |
| `brand_lifesupply` | About LifeSupply.ca | navigation | internal `/our-operations/lifesupply/` | — | — |
| `brand_wellmart` | About Wellmart Medical | navigation | internal `/our-operations/wellmart-medical/` | — | — |
| `brand_clinics` | About LifeSupply Clinics | navigation | internal `/our-operations/lifesupply-clinics/` | — | — |
| `brand_balkowitsch` | About Balkowitsch Worldwide | navigation | internal `/our-operations/balkowitsch/` | — | — |
| ~~`technology_fulfilment`~~ | Technology & fulfilment | withdrawn 2026-09-08 with the page | — | — | — |
| `contact_directory` | Contact | navigation | internal `/contact/` | — | — |
