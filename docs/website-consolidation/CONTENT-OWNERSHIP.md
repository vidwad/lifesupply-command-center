# Content ownership — where everything lives after consolidation

The rule: **transfer before retiring.** A page is retired only once every unique thing on it has a named home below, and the QA sweep checks the destination renders that content.

## Final navigation groups

| Primary item | Contains |
| --- | --- |
| **About** | About LifeSupply; Leadership & Board |
| **Medical Supplies** | Medical Supplies overview; LifeSupply; Wellmart Medical; Balkowitsch Worldwide |
| **Solutions** | Clinic Solutions; Pharmacy Solutions; Metabolic Health Solutions |
| **Investors** | Investor Overview; Growth Strategy; Advanced Therapeutics; Acquisitions & Strategic Transactions; News & Resources; Disclosures |
| **Contact** | Direct link to `/contact`, last, no dropdown |

Utility: **Shop Stores** → `/medical-supply-solutions#stores`. The duplicate Contact utility link is removed. Footer keeps operating-brand, policy and the authorized staff-login links.

**No `/solutions` landing page exists.** Solutions is a menu only.

## Clinic Solutions — `/clinic-solutions`

One page covering the whole relationship: plan, equip, supply.

| Section | Anchor | Absorbs |
| --- | --- | --- |
| Introduction and three starting points | — | Existing hub opening; current scope and geographic availability |
| Planning, design and construction | `#planning` | Existing hub service descriptions, clinic types, project process, geography, delivery arrangements, project attribution, consultation action |
| Equipment and opening supplies | `#equipment` | All of `/clinic-solutions/equipment`: room-by-room planning, quote checklist, equipment and supply information, opening-supply category links, equipment-quote action |
| Ongoing clinic supplies | `#ongoing-supplies` | All of `/clinic-solutions/ongoing-supplies`: routine procurement, store categories, ordering, accounts, currency, support, supply-review enquiry, and the distinction between ordinary purchasing today and any proposed replenishment or contracted procurement |
| Clinic collaboration | `#collaboration` | Relevant `/partners/clinics` content, plus a concise proposed supply-program explanation and a link to Metabolic Health for the fuller scope. **Stage 1 links to `/metabolic-health`, not `/metabolic-health#collaboration`:** that anchor does not exist until stage 2 builds it, and a link to a fragment nothing renders is worse than a link to the page. Stage 2 narrows it. |
| Published project examples | — | Existing verified references and links, unchanged |
| Enquiries and questions | — | Consultation, equipment quote, supply review, consolidated FAQs |

**The full ongoing-procurement explanation lives here.** Medical Supplies keeps a concise professional-buying introduction that links to `/clinic-solutions#ongoing-supplies` rather than repeating it.

## Pharmacy Solutions — `/pharmacy-solutions`

The authoritative explanation of the pharmacy supply model. Absorbs `/partners/pharmacies` at `#partner-program`.

Covers: introduction and development status; the intended pharmacy customer; proposed pharmacist-selected non-drug configurations; patient-support materials and proposed ordering; initial supplies, consumables and occasional items; replenishment and proposed fulfilment; responsibilities for selection, stockholding, shipment, invoicing, support, complaints and recalls; the development and confirmation process; FAQs; one contextual enquiry.

Two distinctions are held here: **supplying independently operated pharmacies** against **LifeSupply potentially owning or operating licensed pharmacy activity**, the latter remaining an investor-facing option under evaluation whose detail lives on Advanced Therapeutics.

The pharmacy pathway on Metabolic Health stays a concise use case linking here.

## Metabolic Health Solutions — `/metabolic-health`

Displayed as "Metabolic Health Solutions". Absorbs the care-kits hub, all eight pathway pages and refills.

| Section | Anchor |
| --- | --- |
| Introduction and status | — |
| Commercial model | — |
| Eight supply pathways | `#pathways` |
| Replenishment | `#replenishment` |
| Program collaboration | `#collaboration` |
| Development and availability | — |
| Enquiry and FAQs | — |

Each pathway keeps a stable anchor matching its existing slug: `#glp-1-support`, `#injection-safety`, `#sharps-supplies`, `#travel-support`, `#home-monitoring`, `#diabetes-supplies`, `#clinic-injectable-supplies`, `#pharmacy-patient-support`.

For every pathway these are preserved: intended audience, distinct supply purpose, starter/consumable/occasional roles, compatibility requirements, exclusions, verified store-category destinations where they exist, unique FAQ information, and a contextual enquiry.

No pathway is presented as a purchasable boxed product, an approved configuration or an available subscription.

## Other destinations

| Retired | Content goes to |
| --- | --- |
| `/shop` | `/medical-supply-solutions#stores` — geography, currency, support, category emphasis, direct store actions |
| `/partners` | `/contact#business-inquiries` — the enquiry routing it offered |
| `/abdul-ladha` | `/about-us#abdul-ladha` |
| `/keith-dolo-2` | `/about-us#keith-dolo` |
| `/barrett-e-g-sleeman` | `/about-us#barrett-sleeman` |
| `/david-vogt` | `/about-us#david-vogt` |
| `/our-team` | `/about-us` — see below |

Abdul Ladha is presented **once**, with the appropriate combined role. Where a role is supported only by legacy material it is qualified honestly rather than presented as newly confirmed. No title, appointment, credential or headshot is fabricated.

## Pages that lose duplication rather than gain it

- **Home** drops the long repeated company explanations and redundant routing, keeping the proposition, the operating businesses and their destinations, qualified scale, a concise Solutions introduction, investor routes and enquiry actions.
- **About** becomes the primary home for identity, mission, entity structure, footprint, history and the company video, with a concise linked expansion summary instead of repeating Growth Strategy.
- **News & Resources** drops the long company overview and links to About.
- **Contact** moves the full subsidiary narrative to About and keeps its enquiry-first layout, working subjects, direct details, copy-email fallback and verified external destinations.
- **Growth Strategy** stays focused on the proposed execution sequence and dependencies, linking to history and news rather than repeating them.
- **Disclosures** remains the authoritative financial scope, sharing its published metric data with other pages so no value can drift.

## Stage 5 (2026-09-11): Our team into About

The product owner set About's shape: hero, Mission and Vision beside the
company video, the "Since inception" band, and then the team — the title and
text `/our-team/` opened with, Leadership, and the Board of Directors, with
nothing after them but the footer.

| Was on `/our-team/` | Now |
| --- | --- |
| Hero title and description | The first content under the band on `/about-us/` |
| Leadership card | `/about-us/`, unchanged |
| Board of Directors cards | `/about-us/#board`, unchanged |
| The four biographies, as sections | `/about-us/#<anchor>`, each as a dialog opened by `:target` in CSS, so a deep link still reveals the profile with JavaScript disabled |

| Was on `/about-us/` after the band | Now |
| --- | --- |
| Footprint and milestones | The homepage, through `about-sections.tsx` |
| The operating-base band | The homepage, same file |
| Operating brands | The homepage |
| Growth direction | The homepage, same file |
| Program architecture (three tiers) | The homepage, tiers only |
| Developing opportunities | The homepage, same file |
| Corporate structure statement | **Not rendered.** "One parent company, three wholly-owned subsidiaries" is still in `content/about.ts`, and Contact still names all three entities with their acquisition detail, but the sentence itself is unpublished. Flagged to the product owner. |
| The two architecture notes | **Published on About since 2026-09-12.** "The two meanings of pharmacy" and "How participation works" were unpublished from 2026-09-11, when the product owner took them off the homepage and About then lost the section that carried them. The product owner moved the whole program-architecture section to About on 2026-09-12, between the "Since inception" band and the team, and the notes render again beneath the tiers there. The section renders on that page only. |
