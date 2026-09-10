# Website asset manifest

Every image, diagram and media file the public site serves, with where it is used, how it may be described, and where it came from. Registries in `src/lib/public-site/` are the authority for size and alt text; this manifest is the human-readable index. Provenance identifiers `S-xx` refer to `docs/website-development/SOURCE_REGISTER.md`.

**Illustrative status.** Generated and stock imagery is never evidence of actual staff, facilities, patients, projects, equipment ownership or operational capability. Only the leadership portraits, the store screenshots, the hero footage and the company video show something real, and each says what it is.

## Diagrams (code, not raster)

| Diagram | Component | Placement | Text equivalent | Notes |
| --- | --- | --- | --- | --- |
| Clinic entry choice | `pages/clinic-solutions.tsx` | Clinic Solutions, before the three needs | Two semantic cards; each states its scope and carries its own action | HTML in tokens, no image file. Added 2026-09-09 on a Codex recommendation so a visitor with an open clinic is not routed through construction copy |
| Care pathway hub and spoke | `care-pathway-diagram.tsx` | Pharmacy Solutions, "Connecting supply needs across the care pathway" | Every word is real text from `content/pharmacy.ts`; a labelled group containing a list | Typeset in tokens, no image file. Connectors decorative and hidden from assistive technology. Replaced a generated raster on 2026-09-09 (S-160) |

## Photography and graphics

| File under `public/lsh/` | Used by | Placement | Alt text source | Provenance |
| --- | --- | --- | --- | --- |
| `abdul-ladha.jpg`, `keith-dolo.jpg`, `barrett-sleeman.jpg`, `david-vogt.jpg` | `content/team.ts` | Our team, leadership profiles | Person's name | Real portraits copied from the prior lifesupplyhealth.com profiles, 2026-09-09 (S-104, S-153 to S-155) |
| `graphics/*.jpg` (boardroom, equipment, exam-room, facade, metabolic-supplies, pharmacy, shipping, supplies-flatlay, warehouse) | `graphics.ts` | Split sections and bands across the site | Registry alt, each beginning "Conceptual" | Gamma photo mode, monochrome brief, ffmpeg grayscale-plus-red treatment, 1600×900 (S-136 to S-144). Never operational photography |
| `graphics/brands/*-greyscale-v1.jpg` (PNG masters retained) | `graphics.ts` `BRAND_GRAPHICS` | Brand cards | Registry alt | Supplied by the product owner, PR #86 (S-145 to S-148). The Balkowitsch image shows a synthetic person who is never presented as staff or a customer |
| `graphics/legacy/about-desk.jpg`, `about-data.jpg`, `about-warehouse.jpg` | `legacy-bands.ts` | About hero backdrop and two parallax dividers | Empty; decorative | Stock photographs the prior About page used as section backgrounds, copied 2026-09-09, greyscale, 1920×1080 (S-157 to S-159) |
| `sites/*-home-laptop.jpg` | `site-screens.ts` | Medical Supplies store pages, Clinic Solutions | Registry alt naming the host | Dated screenshots of each live storefront at 1440×900, promotional overlays hidden, composed on a laptop frame (S-149 to S-152). Refresh when a storefront changes |
| `hero/hero-loop.webm`, `hero-loop.mp4`, `hero-poster.jpg` | `content/home.ts` `heroMedia` | Homepage hero | Decorative; hidden from assistive technology | The 2021 legacy hero video re-cut to caption-free scenes, desaturated, looped (S-132). No audio, no on-screen control, pauses off screen |
| `hero/stills/*.jpg` | Held, not served | — | — | Frames from the same footage, retained for future use |
| `video/about-abdul-ladha-poster.jpg` | `video.ts` | About page video | Names the speaker and the video | The company video's own title frame, greyscale, held locally so nothing loads from YouTube before play (S-156) |
| `lifesupply-mark.png` | Layout | Header and footer | Company name | Official mark, product owner, 2026-09-08 (S-130). Dark field only |
| `og-default.jpg` | `seo.ts` | Social preview | — | Site-wide default card |
| `investor-presentation-preview.png` | Held, not served | — | — | Retained; not published |

## Loading

Every served image goes through `next/image` at its registered size. Each usage carries a `sizes` hint matching the slot it renders into, so the pipeline does not ship a full-resolution file for a small one; the brand marks, the footer mark and the leadership portraits were given hints on 2026-09-09. Only the two images that can appear above the fold, the hero poster and the About hero backdrop, are marked `priority`; everything else loads lazily.

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
