# Operating-site handoffs

**Status of this document:** draft prepared in Stage 3 (September 8, 2026) as the guide's Stage 3 task "produce external-site handoff notes". Stage 8 owns and maintains it. **Every row below is `proposed`.** Nothing has been applied to any operating site; this repository has no admin or repository access to them (WEB-08), and none is assumed.

Statuses: `proposed` → `implemented` (applied by the site's own owner through its own admin or repository workflow) → `verified` (checked independently from this repository after implementation). A row moves only with the evidence named in its "Verification" column.

## Destination map (corporate side, verified 2026-09-08)

The corporate site currently lives on the Vercel production alias; `lifesupplyhealth.com` still serves the legacy WordPress site (BASELINE_AUDIT §5, §8). Until the Stage 10 cutover, **no reciprocal link should be applied**, because the only stable public destination would point at the old site. The handoffs below therefore name the post-cutover canonical URLs and mark the cutover as their prerequisite.

| Corporate destination (post-cutover) | Purpose |
| --- | --- |
| `https://lifesupplyhealth.com/` | corporate hub |
| `https://lifesupplyhealth.com/our-operations/lifesupply/` | LifeSupply brand page |
| `https://lifesupplyhealth.com/our-operations/wellmart-medical/` | Wellmart Medical brand page |
| `https://lifesupplyhealth.com/our-operations/lifesupply-clinics/` | LifeSupply Clinics brand page |
| `https://lifesupplyhealth.com/our-operations/balkowitsch/` | Balkowitsch Worldwide brand page |
| `https://lifesupplyhealth.com/clinic-solutions/` | clinic lifecycle hub |
| `https://lifesupplyhealth.com/investor-relations/` | investors |

Attribution parameters: none proposed. If Stage 8 introduces measurement, use validated, deliberate parameters only (guide §2); never `srsltid`-style search parameters.

## Per-site briefs

### lifesupply.ca (BigCommerce, Stencil theme)

| Item | Proposal |
| --- | --- |
| Placement 1 | Footer "About" column, one link: **"Part of the LifeSupply group"** → corporate hub. |
| Placement 2 | Existing `/about-us/` page: one sentence at the end of the "Wellmart Health Supplies Ltd." paragraph: **"Corporate information for the group is published at lifesupplyhealth.com."** with the link. |
| Placement 3 (optional) | `/clinic-supplies/` category description: **"Planning or equipping a clinic? See Clinic Solutions."** → clinic lifecycle hub. |
| Copy constraints | No group figures, no entity-relationship wording beyond what the store already publishes (S-10). |
| Owner | unknown (WEB-08) |
| Prerequisite | Stage 10 cutover of `lifesupplyhealth.com` |
| Verification | fetch the three pages after implementation; confirm each link resolves 200 to the corporate route; screenshot to `evidence/stage-08/` |
| Status | proposed |

### wellmartmedical.com (BigCommerce, Stencil theme)

| Item | Proposal |
| --- | --- |
| Placement 1 | Footer: **"Part of the LifeSupply group"** → corporate hub. |
| Placement 2 | `/about-us/` page: **"Corporate information for the group is published at lifesupplyhealth.com."** with the link. |
| Copy constraints | Do not describe professional buyers as excluded; the home-care emphasis is corporate-side marketing direction only (guide §2). |
| Owner | unknown (WEB-08) |
| Prerequisite | Stage 10 cutover |
| Verification | as above |
| Status | proposed |

### www.lifesupplyclinics.com (WordPress)

| Item | Proposal |
| --- | --- |
| Placement 1 | Footer: **"Part of the LifeSupply group"** → corporate hub. |
| Placement 2 | `/about/` page: **"Corporate information, including how clinic development connects to equipment and ongoing supply, is published at lifesupplyhealth.com."** → clinic lifecycle hub. |
| Placement 3 | `/clinic-equipments/` or `/buy-clinic-equipment/`: **"Opening supplies and consumables are available on LifeSupply.ca."** → `https://lifesupply.ca/clinic-supplies/` (verified). This is a store-to-store link the Clinics site does not currently carry. |
| Copy constraints | Keep the Clinics site's own attribution wording ("core partners"); do not add group figures; do not imply patient-care operations. |
| Owner | unknown (WEB-08); the site credits a third-party web agency in its footer, which may hold admin access |
| Prerequisite | Stage 10 cutover for placements 1 and 2; placement 3 has no prerequisite beyond owner approval |
| Verification | as above; additionally confirm the Clinics privacy policy needs no change for outbound links |
| Status | proposed |

### balkowitsch.com (BigCommerce, Stencil theme)

| Item | Proposal |
| --- | --- |
| Placement 1 | Footer: **"Corporate information: lifesupplyhealth.com"** → corporate hub. Wording avoids "part of the group" because the relationship is unconfirmed (S-15, WEB-01). |
| Placement 2 | none until WEB-01 records the relationship |
| Copy constraints | Preserve the store's established identity, USD pricing, and its own policies; no Canadian store wording. |
| Owner | unknown (WEB-08) |
| Prerequisite | WEB-01 decision, then Stage 10 cutover |
| Verification | as above |
| Status | proposed |

## Support-routing check (all four sites)

Each store's published contact page remains the support destination for orders placed there. The corporate site links those pages from every brand page, the Shop & Services page, and the Contact page's "Existing order?" block (Stage 3). No change is proposed to any store's support flow.

## Open items for Stage 8

- Named owners and access path per site (WEB-08).
- Whether reciprocal links should wait for the custom-domain cutover (recommended above) or use an interim alias.
- Analytics event taxonomy and consent handling (guide Stage 8), which this document does not yet cover.
