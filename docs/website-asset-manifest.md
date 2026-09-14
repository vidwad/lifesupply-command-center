# Website asset manifest

Every image, diagram and media file the public site serves, with where it is used, how it may be described, and where it came from. Registries in `src/lib/public-site/` are the authority for size and alt text; this manifest is the human-readable index. Provenance identifiers `S-xx` refer to `docs/website-development/SOURCE_REGISTER.md`.

**Illustrative status.** Generated and stock imagery is never evidence of actual staff, facilities, patients, projects, equipment ownership or operational capability. Only the leadership portraits, the store screenshots, the hero footage, the company video and the clinic project photographs show something real, and each says what it is.

**Two registries, opposite rules.** `graphics.ts` holds conceptual imagery: every alt begins "Conceptual", every entry is labelled "not operational photography", and a test enforces both. `project-photography.ts` holds photographs of completed clinic projects, each naming the published project page it came from, and its test asserts the inverse — nothing there may be described as conceptual, no person may appear, and no brand name may appear in the alt text. Neither registry's files may be used through the other.

## Diagrams (code, not raster)

| Diagram | Component | Placement | Text equivalent | Notes |
| --- | --- | --- | --- | --- |
| Clinic entry choice | `pages/clinic-solutions.tsx` | Clinic Solutions, before the three needs | Two semantic cards; each states its scope and carries its own action | HTML in tokens, no image file. Added 2026-09-09 on a Codex recommendation so a visitor with an open clinic is not routed through construction copy |
| Supply model, two lanes | `supply-model-diagram.tsx` | Metabolic Health Solutions, "Four parts, two kinds of arrangement" | Two labelled lists: store purchasing (solid rule, available today) and proposed services (dashed rule, in development), each naming its two parts from `content/metabolic.ts` | Typeset in tokens, no image file. Added 2026-09-11 so the distinction between an ordinary store purchase and a contracted service is seen before it is read; the red bar between the lanes is decorative and hidden from assistive technology |
| Item roles, three steps | `supply-roles-diagram.tsx` | Metabolic Health Solutions, Replenishment | An ordered list of the three roles - starter equipment, consumables, occasional items - each with when it is bought, from `content/metabolic.ts`; arrows decorative | Typeset in tokens with the registry icons the pathway cards use. Added 2026-09-11 in place of a photograph: a picture of a kit would read as a kit that exists, and none does |
| People aged 65 and older, Canada and the United States | `demographic-chart.tsx` | Medical Supplies, "Aging populations. Ongoing supply needs."; Investors, "Market demand" (the same content object, 2026-09-13) | Two labelled lists of year and value from `content/businesses.ts`; the projection row is a dashed outline carrying no figure; legend, sources and qualification are text | Typeset in tokens, no image file. Added 2026-09-13; bars in brand red that grow in when first seen, figures as static text (2026-09-13). Every figure is recorded in `docs/website-content-evidence.md`, "Market context"; a canary holds the block to those figures and to no market-growth or revenue claim |
| Illustrative supply portal | `portal-concept.tsx` | Medical Supplies, "A supply portal built around your organization." | Three tab panels of real text: an approved catalogue and saved lists, an approval queue with order history and reminders, and activity counts with a share-by-category summary | Typeset in tokens, no image file. Added 2026-09-13. Labelled "Illustrative portal concept — proposed capabilities" at all times; the demonstration data is invented in the component, names no person or patient, and shows no amount of money |
| Care pathway hub and spoke | `care-pathway-diagram.tsx` | Pharmacy Solutions, "Connecting supply needs across the care pathway" | Every word is real text from `content/pharmacy.ts`; a labelled group containing a list | Typeset in tokens, no image file. Connectors decorative and hidden from assistive technology. Replaced a generated raster on 2026-09-09 (S-160) |

## Photography and graphics

| File under `public/lsh/` | Used by | Placement | Alt text source | Provenance |
| --- | --- | --- | --- | --- |
| `abdul-ladha.jpg`, `keith-dolo.jpg`, `barrett-sleeman.jpg`, `david-vogt.jpg` | `content/team.ts` | Our team, leadership profiles | Person's name | Real portraits copied from the prior lifesupplyhealth.com profiles, 2026-09-09 (S-104, S-153 to S-155) |
| `graphics/*.jpg` (boardroom, equipment, exam-room, facade, metabolic-supplies, pharmacy, shipping, supplies-flatlay, warehouse) | `graphics.ts` | Split sections and bands across the site | Registry alt, each beginning "Conceptual" | Gamma photo mode, monochrome brief, ffmpeg grayscale-plus-red treatment, 1600×900 (S-136 to S-144). Never operational photography |
| `graphics/news-desk.jpg` | `graphics.ts` `newsDesk` | News & Resources heroes (hub, item, resource, unavailable) | Registry alt, beginning "Conceptual" | Gamma photo mode, monochrome brief, neutral greyscale at 1600×900, no red treatment (S-165). Commissioned 2026-09-11 for the hero pass, the one page family the existing set had nothing for. Never operational photography |
| `graphics/medical-supplies/audience-home-greyscale-v1.jpg`, `audience-clinic-greyscale-v1.jpg` | `graphics.ts` `audienceHome`, `audienceClinic` | Medical Supplies, the two audience panels | Registry alt, beginning "Conceptual" | Gamma photo mode, commissioned 2026-09-13, monochrome brief, no person, no text, no logo, neutral greyscale at 1600×900 (S-167, S-168). A home setting and a generic stock room; never a LifeSupply premises, a customer, or a project |
| `graphics/medical-supplies/category-*-greyscale-v1.jpg` (bathroom, monitoring, wound, clinic-dental, injection, incontinence, respiratory) | `graphics.ts` `category*` | Medical Supplies, the category explorer tiles; Mobility & Daily Living reuses `brandWellmart` | Registry alt, beginning "Conceptual" | Gamma photo mode, commissioned 2026-09-13, monochrome brief, blank cartons and screens, no packaging text, no product branding, neutral greyscale at 1600×900 (S-169 to S-175). Each illustrates a category and is never a specific product for sale; the page says so beneath the grid |
| `graphics/investors/*.png` (three illustrations) | `graphics.ts` `businessStores`, `businessUs`, `businessClinic` | Investors, above the three operating-foundation columns | Registry alt, beginning "Conceptual" | Isometric illustrations supplied by the product owner on 2026-09-13 (S-177): a store's goods with a laptop, a fulfilment box with a hand truck and an order list, an examination room with a floor plan. Not photographs; no person, real product, premises or order. The one set on the site that keeps the owner's red accents |
| `graphics/medical-supplies/supply-portal.jpg` | `graphics.ts` `portalMonitor` | Medical Supplies, beside the "A supply portal built around your organization" heading | Registry alt, beginning "Conceptual" | Monitor render of the page's own illustrative portal concept, supplied by the product owner on 2026-09-13 (S-178); the screen carries the concept's label and fictional-data note. Not a live product, account or order |
| `graphics/clinic-solutions/clinic-project.jpg`; `graphics/investors/clinic.png` and `stores.png` (existing) | `graphics.ts` `clinicProject`, `businessClinic`, `businessStores` | Clinic Solutions, the three router cards under "Start here", one above each card in the same 4:3 frame | Registry alt, beginning "Conceptual" | The project render was supplied by the product owner on 2026-09-13 (S-180), resized to 1440×960 and saved as JPEG; the other two are the investor-page renders the owner supplied again for this placement. Not photographs; no person, real project, premises or product |
| `graphics/pharmacy/supplies.png` | `graphics.ts` `pharmacySupplies` | Pharmacy Solutions hero, beside the copy on wide screens and beneath the actions on narrow ones | Registry alt, beginning "Conceptual" | Isometric illustration supplied by the product owner on 2026-09-13 (S-181), trimmed and squared to 960×960, palette PNG. Not a photograph; no person, medication or real product |
| `graphics/pharmacy/injection-accessories-greyscale-v1.jpg`, `supply-organization-greyscale-v1.jpg` | `graphics.ts` `pharmacyInjection`, `pharmacyOrganization` | Registered 2026-09-13 for six representative-supplies tiles on Pharmacy Solutions; unpublished the same day when the page was re-scoped and the tiles became the eight explorer categories (which reuse the Medical Supplies category graphics) | Registry alt, beginning "Conceptual" | Gamma photo mode, 2026-09-13 (S-182, S-183), monochrome brief, neutral greyscale at 1600×900; no person, logo or packaging text; never a specific product offered for sale |
| `graphics/news-desk.jpg` (existing) | `graphics.ts` `newsDesk` | Investors, the contact block's right column, behind the channel on wide screens and beneath it on narrow ones | Decorative (`alt=""`, `aria-hidden`); the channel, email and phone are text | Greyscale and faded into the block's charcoal on every edge (`.lsh-contact-graphic`), 2026-09-13. Conceptual still life already in the registry; not a real desk or document |
| `graphics/investors/information.jpg`, `monitoring.jpg`, `ordering.jpg` | `graphics.ts` `technologyInformation`, `technologyMonitoring`, `technologyOrdering` | Investors, above the three technology steps | Registry alt, beginning "Conceptual" | Isometric illustrations supplied by the product owner on 2026-09-13 (S-179), resized to 960×960 and saved as JPEG. Not photographs; no person, real system, product or order |
| `graphics/brands/*-greyscale-v1.jpg` (PNG masters retained) | `graphics.ts` `BRAND_GRAPHICS` | Brand cards | Registry alt | Supplied by the product owner, PR #86 (S-145 to S-148). The Balkowitsch image shows a synthetic person who is never presented as staff or a customer |
| `graphics/legacy/about-desk.jpg`, `about-data.jpg`, `about-warehouse.jpg` | `legacy-bands.ts` | About hero backdrop and two parallax dividers | Empty; decorative | Stock photographs the prior About page used as section backgrounds, copied 2026-09-09, greyscale, 1920×1080 (S-157 to S-159) |
| `sites/*-home-laptop.jpg` | `site-screens.ts` | Medical Supplies store pages, Clinic Solutions | Registry alt naming the host | Dated screenshots of each live storefront at 1440×900, promotional overlays hidden, composed on a laptop frame (S-149 to S-152). Refresh when a storefront changes |
| `hero/hero-loop.webm`, `hero-loop.mp4`, `hero-poster.jpg` | `content/home.ts` `heroMedia` | Homepage hero | Decorative; hidden from assistive technology | The 2021 legacy hero video re-cut to caption-free scenes, desaturated, looped (S-132). No audio, no on-screen control, pauses off screen |
| `hero/stills/*.jpg` | Held, not served | — | — | Frames from the same footage, retained for future use |
| `video/about-abdul-ladha-poster.jpg` | `video.ts` | About page video | Names the speaker and the video | The company video's own title frame, greyscale, held locally so nothing loads from YouTube before play (S-156) |
| `graphics/projects/clinic-burnaby.jpg`, `clinic-abbotsford.jpg`, `clinic-vancouver-medical.jpg` | `project-photography.ts` | Clinic Solutions: the hero backdrop and the three featured projects | Registry alt describing the room | **Real photography, not conceptual.** Photographs of completed projects published by LifeSupply Clinics on the project pages named in the registry; copied 2026-09-11, neutral greyscale, 1600×900 (S-161 to S-163). Kept in a separate registry from the conceptual set, with a test asserting the inverse rules: never called conceptual, no person, no brand name in the alt text. They replaced a laptop screenshot of the LifeSupply Clinics home page, which illustrated six clinic projects with a picture of another website (product owner) |
| `logos/*.png` (29 brand marks) | `supplier-logos.ts` `SUPPLIER_LOGOS` | The brand band at the top of the footer, on every public page | The brand name, once; the looping copy carries empty alt text and is hidden from assistive technology | Each mark is the image the store itself publishes on its brands directory (lifesupply.ca/brands/, wellmartmedical.com/brands/), copied 2026-09-13 at its original upload size, white keyed out, greyscale with alpha, trimmed, 96px tall (S-176). Listed only because the store lists the brand: never a partnership, contract, or endorsement claim, and the band says "carried". Third-party marks; remove any on the owner's request |
| `lifesupply-mark.png` | Layout | Header and footer | Company name | Official mark, product owner, 2026-09-08 (S-130). Dark field only |
| `og-default.jpg` | `seo.ts` | Social preview | — | Site-wide default card |
| `investor-presentation-preview.png` | Held, not served | — | — | Retained; not published |

## Loading

Every served image goes through `next/image` at its registered size. Each usage carries a `sizes` hint matching the slot it renders into, so the pipeline does not ship a full-resolution file for a small one; the brand marks, the footer mark and the leadership portraits were given hints on 2026-09-09. The images that can appear above the fold are marked `priority`: the hero poster, the About hero backdrop, and since 2026-09-11 the conceptual graphic behind every page hero (`graphic-backdrop.tsx`, one per page, from the registry); everything else loads lazily.

## Visual proposals considered and declined

Codex reviewed the whole site on 2026-09-09 and recommended the smallest useful set. Its full proposal is kept at `docs/website-development/evidence/improvement-2026-09-09/stage3/codex-visual-proposal.md`. Declined, with reason:

| Candidate | Reason it was not built |
| --- | --- |
| Homepage group ecosystem diagram | Would repeat the brand cards and could suggest integration between businesses that keep separate accounts |
| Growth strategy roadmap | A roadmap implies an approved sequence or timetable that no source establishes |
| Growth strategy capability diagram | The business case already carries the comparison as headed text; arrows would imply certainty |
| New financial or operating chart | No approved trend or comparison exists to chart; permission to publish a number is not a reason to draw one |
| Additional generated photography | The site has enough imagery, and more could not substantiate operational capability |

Codex also proposed replacing the storefront laptop screens with a plain four-website directory. That was not done: the screens were requested by the product owner on 2026-09-09, and the facts the directory would add (market, currency, separate accounts and support) are already carried by the brand cards and the store-choice section.

## Hero backdrops

Since 2026-09-11 every page hero carries a conceptual graphic from the registry beneath `PublicHero`'s scrim, through `graphic-backdrop.tsx`, on the pattern Clinic Solutions set with a real project photograph. Decorative and hidden from assistive technology. The image per page:

| Page | Graphic |
| --- | --- |
| Medical Supplies | `suppliesFlatlay`; the audience panels and explorer tiles are listed above |
| LifeSupply store | `brandLifeSupply` |
| Wellmart Medical store | `brandWellmart` |
| Balkowitsch Worldwide store | `warehouse` (the brand image shows a synthetic person, who must never stand behind a page as if staff) |
| Clinic Solutions | real project photograph, `project-photography.ts` |
| Pharmacy Solutions | `pharmacy` |
| Metabolic Health Solutions | `metabolicSupplies` |
| Suppliers & Manufacturers | `shipping` |
| Acquisitions | `boardroom` |
| Investor Relations | `boardroom` |
| Growth Strategy, Disclosures, Privacy, Terms, Accessibility | `facade` |
| Advanced Therapeutics | `equipment` |
| Our Team | `boardroom` |
| News & Resources | `newsDesk` |
| Contact | `brandClinics` |
| Home | hero footage; About | legacy backdrop — both unchanged |

## Rules for new assets

- Greyscale, in keeping with the black, white and red identity.
- Composed so both a wide banner and a square card crop keep the subject; nothing important within 8 per cent of any edge.
- No embedded text, no logos, no invented branding.
- Served as JPEG under 400 KB at its declared size, through `next/image`, with the size recorded in a registry that its own test checks.
- Alt text describes what the picture shows, or is empty when the image is decorative and the layer is hidden from assistive technology.
- Precise business information is drawn as HTML or SVG, not generated as a picture. Charts are built only from figures approved for publication.
- Every new file gets a row here and a provenance row in the source register before it ships.

## Removed

| File | Removed | Reason |
| --- | --- | --- |
| `graphics/diagrams/pharmacy-care-pathway.jpg` | 2026-09-09 | A generated raster whose text was pixels; replaced by the typeset care-pathway component |
| `lifesupply-portfolio-lockup.png`, `operations-timeline.jpg` | 2026-09-08 | Named brands that are no longer operational, and rendered figures as pixels. Moved to `docs/website-development/legacy-assets/` |
