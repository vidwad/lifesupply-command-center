# Restructure of September 8, 2026: evidence

**Base:** `main` at `0ffa083`
**Branch:** `claude/website-restructure`
**Direction (product owner, 2026-09-08):** rename Our Businesses to Medical Supply Solutions with the three stores; make Clinic Solutions represent LifeSupply Clinics with the "plan it, equip it, keep it supplied" spine kept in that section; improve Metabolic Health from the partner overview so it represents more than care kits and refills; add a Pharmacy Solutions section so the site can carry pharmacy plans ahead of any operation; reduce the team page to Abdul Ladha.

## Navigation

| Before | After |
| --- | --- |
| Our Businesses (LifeSupply, Wellmart Medical, LifeSupply Clinics, Balkowitsch) | Medical Supply Solutions (LifeSupply, Wellmart Medical, Balkowitsch Worldwide) |
| Clinic Solutions (Design & build, Equipment, Ongoing supplies) | Clinic Solutions = LifeSupply Clinics (Equipment, Ongoing supplies) |
| Metabolic Health (Care kits, Refills) | unchanged children; hub rebuilt |
| — | Pharmacy Solutions |
| Partners, Investors, About | unchanged |

## What changed

| Area | Change |
| --- | --- |
| Medical Supply Solutions | New hub at `/medical-supply-solutions/` with the three store cards and photographs, plus hand-offs to Clinic Solutions and Shop & Services. Store pages moved under it. Corporate material (approved operating statement, published entities, shared capabilities, developing programs) moved to About. |
| Clinic Solutions | The hub is the LifeSupply Clinics section: three-need router (consultation on the Clinics site, Equipment, Ongoing supplies), services and specialties beside the clinic photograph, four-stage process, published projects, consultation checklist, the Clinics site's channels, and the conditional post-opening supply statement. The former brand page and Design & build child are merged in and redirect. |
| Metabolic Health | Hub rebuilt from the partner overview (volume 1 of 2, September 2, 2026): "Support that stays with the patient"; Start / Continue / Support; four value streams (patient supply pathways, clinic procurement, fulfilment and administration, workflow and reporting); care partners (pharmacies, clinics, care programs) with program support and the partner principle; six configuration dimensions; next step; the overview's important information. The in-development status band and disclaimer stay on every metabolic page; the phrase "diagnostics" in the source was rendered as "monitoring" to keep the site's no-diagnosis rule intact. Care kits and Refills unchanged. |
| Pharmacy Solutions | New section at `/pharmacy-solutions/`: the non-drug supply program for pharmacies (in development), the stated direction for pharmacy-related operations and regulated care infrastructure (under evaluation, as the investor pages state it), and boundaries. No acquisition, transaction, counterparty, licence, dispensing, or timing is named or implied; the section exists so a pharmacy plan has a home before any operation does. |
| Team | Abdul Ladha alone, with his portrait and dated title; the board list and eleven other profiles withdrawn; their twelve addresses (thirteen with the old `/ross-jelveh`) redirect to `/our-team`. The 2022 board-appointment news and milestone items stay as dated history. |
| Contact and actions | The online-sales channel is withdrawn with the leadership change; "Request a supply review" reaches the corporate office. Actions added: `clinic_equipment`, `clinic_ongoing_supplies`, `pharmacy_hub`. |
| Redirects | `/our-operations` and its four children, `/our-operations/technology-fulfilment`, `/clinic-solutions/design-build`, and the withdrawn profile slugs: all permanent (308). Registry redirect rows keep the public-host allowlist and the sitemap derived (40 URLs). |
| Tests | Registry, canary, proxy, and browser tests updated; a restructure canary asserts the redirects, the section names, the Pharmacy Solutions guards, and the single leader. |

## Verification

| Check | Result |
| --- | --- |
| `pnpm format:check`, `pnpm typecheck` (fresh build), `pnpm lint` | Pass |
| `pnpm test` | Pass, 101 files, 1,267 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass |
| Playwright, both projects, `--workers=1` | 71 passed, 5 skipped (`evidence/restructure-2026-09-08/playwright-public.txt`) |
| Captures | `evidence/restructure-2026-09-08/`: Home, About, Medical Supply Solutions, LifeSupply, Clinic Solutions, Equipment, Metabolic Health, Pharmacy Solutions, Team, Contact, Investors at 390, 768, and 1440; the mobile panel at 390. No console error, overflow, or broken image. With seven primary items the About group's hidden dropdown widened the page at 1280 px; the trailing dropdowns now right-align, and a probe at 1280 and 1366 px shows no overflow on Home, About, or Pharmacy Solutions. |

## For the product owner

- Pharmacy Solutions wording: the section deliberately does not mention the planned acquisition. When there is an approved public statement, it belongs on the investor pages first.
- Metabolic Health: the hub now carries the partner overview's model; the companion product guide (volume 2) was not supplied, so the eight pathways remain information pages.
