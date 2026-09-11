# Redirect map

All redirects are **permanent, server-side**, configured in `next.config.ts` using the repository's established convention. No client-side redirect page is introduced.

Trailing slashes stay at the Next default: a slashed request answers 308 to the unslashed path, which is the canonical form (`seo.ts`). That behaviour predates this work and is verified rather than changed.

## The 20 new redirects

| # | From | To | Stage |
| --- | --- | --- | --- |
| 1 | `/shop` | `/medical-supply-solutions#stores` | 1 |
| 2 | `/clinic-solutions/equipment` | `/clinic-solutions#equipment` | 1 |
| 3 | `/clinic-solutions/ongoing-supplies` | `/clinic-solutions#ongoing-supplies` | 1 |
| 4 | `/partners/clinics` | `/clinic-solutions#collaboration` | 1 |
| 5 | `/partners/pharmacies` | `/pharmacy-solutions#partner-program` | 2 |
| 6 | `/metabolic-health/care-kits` | `/metabolic-health#pathways` | 2 |
| 7 | `/metabolic-health/care-kits/glp-1-support` | `/metabolic-health#glp-1-support` | 2 |
| 8 | `/metabolic-health/care-kits/injection-safety` | `/metabolic-health#injection-safety` | 2 |
| 9 | `/metabolic-health/care-kits/sharps-supplies` | `/metabolic-health#sharps-supplies` | 2 |
| 10 | `/metabolic-health/care-kits/travel-support` | `/metabolic-health#travel-support` | 2 |
| 11 | `/metabolic-health/care-kits/home-monitoring` | `/metabolic-health#home-monitoring` | 2 |
| 12 | `/metabolic-health/care-kits/diabetes-supplies` | `/metabolic-health#diabetes-supplies` | 2 |
| 13 | `/metabolic-health/care-kits/clinic-injectable-supplies` | `/metabolic-health#clinic-injectable-supplies` | 2 |
| 14 | `/metabolic-health/care-kits/pharmacy-patient-support` | `/metabolic-health#pharmacy-patient-support` | 2 |
| 15 | `/metabolic-health/refills` | `/metabolic-health#replenishment` | 2 |
| 16 | `/partners` | `/contact#business-inquiries` | 3 |
| 17 | `/abdul-ladha` | `/our-team#abdul-ladha` | 4 |
| 18 | `/keith-dolo-2` | `/our-team#keith-dolo` | 4 |
| 19 | `/barrett-e-g-sleeman` | `/our-team#barrett-sleeman` | 4 |
| 20 | `/david-vogt` | `/our-team#david-vogt` | 4 |

Each is implemented in the stage that retires its source page, **after** the content has moved, so no deployed intermediate state loses information.

## The `/partners` hazard

`/partners/suppliers` and `/partners/acquisitions` are **retained and must keep answering 200** while `/partners` redirects.

The rule for `/partners` is therefore an exact-path rule. **No wildcard, no `:path*`, no prefix match.** A regression test asserts both children return 200 after the redirect is in place, and the QA sweep re-checks them on every run.

## Legacy redirects preserved

Every rule already in `next.config.ts` stays. Their destinations are reviewed so that none now points at a page this work retires, which would create an avoidable chain.

| Legacy source | Destination | Chain check |
| --- | --- | --- |
| `/contact-2` | `/contact` | Retained. No chain |
| `/our-operations` | `/medical-supply-solutions` | Retained. No chain |
| `/our-operations/lifesupply` | `/medical-supply-solutions/lifesupply` | Retained. No chain |
| `/our-operations/wellmart-medical` | `/medical-supply-solutions/wellmart-medical` | Retained. No chain |
| `/our-operations/balkowitsch` | `/medical-supply-solutions/balkowitsch` | Retained. No chain |
| `/our-operations/lifesupply-clinics` | `/clinic-solutions` | Retained. No chain |
| `/our-operations/technology-fulfilment` | `/medical-supply-solutions` | Retained. No chain |
| `/clinic-solutions/design-build` | `/clinic-solutions` | Retained. No chain |
| `/investor-relations/documents` | `/news` | Retained. No chain |
| `/investor-relations/shareholder-services` | `/investor-relations` | Retained. No chain |
| Ten withdrawn profile slugs | `/our-team` | Retained. No chain |

**No legacy destination points at a retired page**, so no legacy rule needs its destination updated. This was checked rather than assumed, and the QA sweep asserts every legacy source still resolves to a 200 in one hop.

## Analytics

No authorized analytics or backlink data is available for this site; it is `noindex` and loads no measurement by policy. **Absence of data is not treated as evidence of zero traffic.** Every retired address gets a permanent redirect to the most specific equivalent destination rather than being dropped, which is the least disruptive implementation available without traffic evidence.

## Internal links

Internal links are updated to point at the **final destination directly**, not at a redirect. The QA sweep crawls every retained page and fails if an internal link targets any of the 20 retired paths.
