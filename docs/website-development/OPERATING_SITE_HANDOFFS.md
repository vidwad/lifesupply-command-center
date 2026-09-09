# Operating-site handoffs

**Status of this document:** drafted in Stage 3, completed and owned by Stage 8 (September 8, 2026). **Every external row below is `proposed`.** This repository has no admin or repository access to any operating site and no owner has been named (WEB-08 arrived unfilled); nothing has been applied to any operating site, and nothing here claims otherwise. The corporate-side items in §4 are implemented in this repository and verified by its tests.

Statuses: `proposed` → `implemented` (applied by the site's own owner through its own admin or repository workflow) → `verified` (checked independently from this repository after implementation, with the evidence named in the row). A row moves only with that evidence.

## 1. Destination map (corporate side)

The corporate site lives on the Vercel production alias (`noindex`); `lifesupplyhealth.com` still serves the legacy WordPress site until the Stage 10 cutover. **No reciprocal link should be applied before the cutover**, because it would point at the old site. Post-cutover canonical destinations:

| Corporate destination | Purpose |
| --- | --- |
| `https://lifesupplyhealth.com/` | corporate hub |
| `https://lifesupplyhealth.com/our-operations/lifesupply/` | LifeSupply brand page |
| `https://lifesupplyhealth.com/our-operations/wellmart-medical/` | Wellmart Medical brand page |
| `https://lifesupplyhealth.com/our-operations/lifesupply-clinics/` | LifeSupply Clinics brand page |
| `https://lifesupplyhealth.com/our-operations/balkowitsch/` | Balkowitsch Worldwide brand page |
| `https://lifesupplyhealth.com/clinic-solutions/` | clinic lifecycle hub |
| `https://lifesupplyhealth.com/clinic-solutions/ongoing-supplies/` | ongoing procurement for an open clinic |
| `https://lifesupplyhealth.com/metabolic-health/` | metabolic-health supply services (in development) |
| `https://lifesupplyhealth.com/partners/` | partner relationships |
| `https://lifesupplyhealth.com/investor-relations/` | investors |

## 2. Attribution parameters (deliberate, validated)

Reciprocal links **from** an operating site **to** the corporate site carry three UTM parameters and nothing else. The corporate site's inquiry contract accepts exactly these three (`campaign.utmSource`, `utmMedium`, `utmCampaign`, each ≤ 100 identifier characters) and stores them with a persisted inquiry; no other parameter is read, and no parameter ever carries visitor data. Never use `srsltid`-style search parameters (guide §2).

| Source site | Parameter string |
| --- | --- |
| lifesupply.ca | `?utm_source=lifesupply-ca&utm_medium=referral&utm_campaign=group-link` |
| wellmartmedical.com | `?utm_source=wellmart-medical&utm_medium=referral&utm_campaign=group-link` |
| www.lifesupplyclinics.com | `?utm_source=lifesupply-clinics&utm_medium=referral&utm_campaign=group-link` |
| balkowitsch.com | `?utm_source=balkowitsch&utm_medium=referral&utm_campaign=group-link` |

Links **from** the corporate site **to** the operating sites stay clean canonical URLs (the store's own analytics see the referrer). Corporate-side clicks are marked with inert data attributes (§5), not query strings.

## 3. Per-site briefs (external; all `proposed`)

Each placement names the exact copy, the destination, and the check that moves it to `verified`. Owner and access path are unknown for every site (WEB-08); the "Owner" row states what is known.

### 3.1 lifesupply.ca (BigCommerce, Stencil theme)

| # | Placement | Exact copy | Destination | Status |
| --- | --- | --- | --- | --- |
| 1 | Footer, "About" column, last item | **Part of the LifeSupply group** | corporate hub + lifesupply.ca UTM string | proposed |
| 2 | `/about-us/`, one sentence at the end of the "Wellmart Health Supplies Ltd." paragraph | **Corporate information for the group is published at lifesupplyhealth.com.** (link on the domain) | corporate hub + UTM | proposed |
| 3 | `/clinic-supplies/` category description, one sentence | **Planning, equipping, or restocking a clinic? See Clinic Solutions.** | clinic lifecycle hub + UTM | proposed |
| 4 | Main navigation | **No change.** The store's navigation stays commercial; a corporate link in the header would compete with checkout. | — | proposed (no-op) |

Copy constraints: no group figures; no entity-relationship wording beyond what the store already publishes (S-10, S-14). Owner: unknown; the store's own contact is `info@lifesupply.com` (S-30). Prerequisite: Stage 10 cutover. Verification: fetch the three pages, confirm each link resolves 200 to the named corporate route with the UTM string intact, screenshot to `evidence/stage-08/external/`.

### 3.2 wellmartmedical.com (BigCommerce, Stencil theme)

| # | Placement | Exact copy | Destination | Status |
| --- | --- | --- | --- | --- |
| 1 | Footer, company column, last item | **Part of the LifeSupply group** | corporate hub + wellmart UTM string | proposed |
| 2 | `/about-us/`, one sentence at the end | **Corporate information for the group is published at lifesupplyhealth.com.** | corporate hub + UTM | proposed |
| 3 | Main navigation | **No change.** | — | proposed (no-op) |

Copy constraints: never describe professional buyers as excluded; the home-care emphasis is corporate-side marketing direction (guide §2). Owner: unknown; store contact `info@wellmartmedical.com` (S-29). Prerequisite: Stage 10 cutover. Verification: as §3.1.

### 3.3 www.lifesupplyclinics.com (WordPress)

| # | Placement | Exact copy | Destination | Status |
| --- | --- | --- | --- | --- |
| 1 | Footer, last line | **Part of the LifeSupply group** | corporate hub + clinics UTM string | proposed |
| 2 | `/about/`, one sentence at the end | **Corporate information, including how clinic development connects to equipment and ongoing supply, is published at lifesupplyhealth.com.** | clinic lifecycle hub + UTM | proposed |
| 3 | `/buy-clinic-equipment/`, one sentence below the quote form | **Opening supplies and consumables are available on LifeSupply.ca.** | `https://lifesupply.ca/clinic-supplies/` (verified S-80); store-to-store, no UTM | proposed |
| 4 | Main navigation | **No change.** The consultation and equipment actions stay primary. | — | proposed (no-op) |

Copy constraints: keep the Clinics site's own attribution wording ("core partners"); no group figures; never imply patient-care operations (guide §2). Owner: unknown; the site footer credits a third-party web agency that may hold admin access; site contact `info@lifesupplyclinics.com` (S-28). Prerequisite: Stage 10 cutover for #1 and #2; #3 needs only owner approval. Verification: as §3.1; additionally confirm the Clinics privacy policy needs no change for outbound links.

### 3.4 balkowitsch.com (BigCommerce, Stencil theme)

| # | Placement | Exact copy | Destination | Status |
| --- | --- | --- | --- | --- |
| 1 | Footer, company column, last item | **Corporate information: lifesupplyhealth.com** | corporate hub + balkowitsch UTM string | proposed |
| 2 | Any page | **None** until WEB-01 records the relationship (S-15). | — | blocked on WEB-01 |
| 3 | Main navigation | **No change.** | — | proposed (no-op) |

Copy constraints: preserve the store's established identity, USD pricing, and its own policies; no Canadian store wording; the wording avoids "part of the group" because the relationship is unconfirmed. Owner: unknown; store contact `sales@balkowitsch.com` (S-24). Prerequisite: WEB-01, then Stage 10 cutover. Verification: as §3.1.

## 4. Corporate-side contextual links (implemented in Stage 8, verified by tests)

Added on the corporate site where a verified destination already existed in the registries; each is an internal route or an approved channel, rendered through the action registry:

| Page | Added links | Why |
| --- | --- | --- |
| `/metabolic-health/` | Clinic Solutions; Clinic collaboration; Pharmacy supply programs | The program depends on clinic and pharmacy relationships |
| `/metabolic-health/care-kits/clinic-injectable-supplies/` (K07) | Request a supply review; Clinic Solutions | Clinic purchasing configurations are a Clinic Solutions conversation |
| `/metabolic-health/care-kits/pharmacy-patient-support/` (K08) | Pharmacy supply programs | The pharmacy partner page states responsibilities |
| `/our-operations/lifesupply/` | Clinic Solutions; Metabolic Health | The store serves both journeys |
| ~~`/our-operations/technology-fulfilment/`~~ | withdrawn 2026-09-08 | Page removed; the address redirects to `/our-operations` |
| `/our-operations/lifesupply-clinics/` | Metabolic Health; About LifeSupply.ca | Post-opening supply and the program |
| `/clinic-solutions/ongoing-supplies/` | Metabolic Health; Clinic collaboration | Procurement customers may join a program or collaborate |

Support routing is unchanged: each store's published contact page remains the support destination for orders placed there, linked from every brand page, Shop & Services, and the Contact page's "Existing order?" block.

## 5. Measurement (defined, not loaded)

The event taxonomy lives in `src/lib/public-site/measurement.ts`: `brand_destination_click` (brand), `clinic_consultation_click` (brand), `equipment_quote_start` (brand), `investor_materials_requested`, `public_document_download` (document type), and the server-only `inquiry_submitted` (intent, brand), recorded by the intake after persistence in `src/server/measurement/events.ts`. Parameters are short identifiers; the page path is never a parameter and no parameter carries visitor data.

Measurable links carry inert `data-measure` attributes. **No measurement script is loaded and no cookie is set**; the consent model defaults to analytics denied, and no control to grant it exists. A consented loader is proposed for Stage 9 or 10 only after (a) an analytics property is approved, (b) consent handling is designed and reviewed, and (c) the privacy page is updated in the same change. Cross-domain measurement across the four operating sites needs access to their own properties (WEB-08) and is not proposed here.

Interpretation rule: an outbound click is an intent signal, never a sale. Revenue attribution requires validated order linkage inside the Command Center and is out of scope.

## 6. Product projection (contract recorded, not built)

No store feed is approved and no page needs one. The contract is `src/lib/public-site/product-projection.ts`: store, SKU, variant or pack, manufacturer reference, currency, region, availability, optional price, destination URL on the store's host, and update time; a projection older than 60 minutes renders as a link with no price or availability, and an unavailable feed never invents either. Building it needs the commerce owner's approval for a specific store and a defined page.

## 7. Open items

- Named owners and access path per site (WEB-08).
- WEB-01 for the Balkowitsch wording.
- Analytics property and consent approval before any loader.
- Stage 10 cutover before any reciprocal link is applied.
