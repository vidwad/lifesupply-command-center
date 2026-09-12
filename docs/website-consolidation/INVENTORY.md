# Public route inventory and reconciliation

**Established September 10, 2026 from `main` at `3e0c687`.**

Enumerated from `src/app/**/page.tsx`, the route registry (`src/lib/public-site/routes.ts`), and the static parameters the dynamic routes generate.

## Reconciliation to the audited 41

| Source | Count |
| --- | --- |
| Static public page files | 29 |
| Pathway pages from `metabolic-health/care-kits/[kit]` | 8 |
| Leadership profiles from `[slug]` | 4 |
| **Total public content pages** | **41** |

This matches the number the audit reported, so **no public page was added or removed** between the audit snapshot and this baseline. Nothing here is a page introduced after the audit, and nothing legitimate is being deleted to hit a number.

Excluded from the count, as the brief directs: `news/[slug]` and `resources/[slug]` (publication templates that render only actually published records), the authenticated Command Center screens under `(dashboard)`, `(auth)` and `(print)`, API routes, and the legacy redirects already configured.

## Retained — 21

| # | Route | Note |
| --- | --- | --- |
| 1 | `/` | Home |
| 2 | `/about-us` | Primary home for company identity, structure, footprint, history, video |
| 3 | `/our-team` | Gained the four leadership biographies in stage 4; **retired 2026-09-11**, absorbed into `/about-us` |
| 4 | `/medical-supply-solutions` | Canonical store-selection hub; absorbs `/shop` |
| 5 | `/medical-supply-solutions/lifesupply` | |
| 6 | `/medical-supply-solutions/wellmart-medical` | |
| 7 | `/medical-supply-solutions/balkowitsch` | |
| 8 | `/clinic-solutions` | One complete page: plan, equip, supply |
| 9 | `/pharmacy-solutions` | Authoritative pharmacy supply model |
| 10 | `/metabolic-health` | One complete page including all eight pathways |
| 11 | `/partners/suppliers` | Path keeps `/partners/`; navigation placement changes |
| 12 | `/partners/acquisitions` | Path keeps `/partners/`; moves into Investors |
| 13 | `/investor-relations` | |
| 14 | `/investor-relations/growth-strategy` | |
| 15 | `/investor-relations/advanced-therapeutics` | |
| 16 | `/investor-relations/disclosures` | |
| 17 | `/news` | News & resources |
| 18 | `/contact` | Last primary item; gains `#business-inquiries` |
| 19 | `/privacy` | |
| 20 | `/terms` | |
| 21 | `/accessibility` | |

**`/partners/suppliers` and `/partners/acquisitions` stay live while `/partners` itself redirects.** No wildcard redirect may capture them; the `/partners` rule is an exact-path rule for that reason, and a regression test asserts both children still answer 200.

## Retired and redirected — 20

| # | Route | Retired because |
| --- | --- | --- |
| 1 | `/shop` | Store selection belongs on the Medical Supplies hub |
| 2 | `/clinic-solutions/equipment` | Part of one complete clinic relationship |
| 3 | `/clinic-solutions/ongoing-supplies` | Part of one complete clinic relationship |
| 4 | `/partners` | Category retired; routing belongs on Contact |
| 5 | `/partners/clinics` | Collaboration belongs on Clinic Solutions |
| 6 | `/partners/pharmacies` | Partner program belongs on Pharmacy Solutions |
| 7 | `/metabolic-health/care-kits` | The catalogue becomes a section |
| 8 | `/metabolic-health/care-kits/glp-1-support` | Pathway becomes an anchored section |
| 9 | `/metabolic-health/care-kits/injection-safety` | as above |
| 10 | `/metabolic-health/care-kits/sharps-supplies` | as above |
| 11 | `/metabolic-health/care-kits/travel-support` | as above |
| 12 | `/metabolic-health/care-kits/home-monitoring` | as above |
| 13 | `/metabolic-health/care-kits/diabetes-supplies` | as above |
| 14 | `/metabolic-health/care-kits/clinic-injectable-supplies` | as above |
| 15 | `/metabolic-health/care-kits/pharmacy-patient-support` | as above |
| 16 | `/metabolic-health/refills` | Replenishment becomes an anchored section |
| 17 | `/abdul-ladha` | Biography merged into `/our-team` in stage 4, and into `/about-us` on 2026-09-11 |
| 18 | `/keith-dolo-2` | as above |
| 19 | `/barrett-e-g-sleeman` | as above |
| 20 | `/david-vogt` | as above |

41 − 20 = **21**.

## Registries that must be updated together

A retired page is not retired until it has left every one of these. Leaving a page rendering behind a canonical tag is explicitly not an acceptable substitute for the redirect.

| Registry | File |
| --- | --- |
| Route records and navigation groups | `src/lib/public-site/routes.ts` |
| Page files | `src/app/**/page.tsx` |
| Redirects | `next.config.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Generated static paths | `generateStaticParams` in the dynamic routes |
| Canonical metadata | `src/lib/public-site/seo.ts` |
| Action destinations | `src/lib/public-site/actions.ts` |
| Canaries and route tests | `src/lib/public-site/registry.test.ts`, `public-boundary.test.ts` |
| End-to-end route list | `tests/e2e/lifesupply-public.spec.ts` |

## Dynamic publication templates

`news/[slug]` and `resources/[slug]` render only records the published read model returns. At this baseline the governed feed returns none, so no individual record exists to enumerate. **No record will be fabricated to fill a template**, and the templates and their approval controls are preserved.
