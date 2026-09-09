# Brand greyscale images — Stage 2 integration

**Date:** September 8, 2026 (UTC)
**Status:** Ready for Review — integrated, verified locally, submitted through the repository's PR and squash-merge workflow on the product owner's standing instruction.
**Base:** `main` at `f5c6d44` (asset PR #86 squash-merged first, so the runtime change is not stacked on an unmerged predecessor)
**Branch:** `claude/website-brand-photos`
**Predecessor:** `BRAND_GREYSCALE_STAGE_1.md` (mapping followed as written)

## What changed

| Area | Files | Change |
| --- | --- | --- |
| Served derivatives | `public/lsh/graphics/brands/*-greyscale-v1.jpg` (new, four files, 95–159 KB, 1600×900) | Exported from the PNG masters with ffmpeg: scaled and cropped to 16:9, saturation zeroed to keep the neutral greyscale, no red treatment. The PNG masters and `manifest.json` are retained untouched. |
| Registry | `src/lib/public-site/graphics.ts` | Four `brand*` entries with true dimensions, the Stage 1 alt descriptions (each beginning "Conceptual"), a distinct `BRAND_PROVENANCE` (product-owner supplied, PR #86, PNG master retained, JPEG derivative, conceptual not operational), and the manifest crop position. `BRAND_GRAPHICS` maps the four `OperatingBrandKey` values explicitly (`wellmart`, `clinics`; never the filename identifiers). Header corrected so the Gamma/no-person description applies only to the design-pass set. |
| Shared component | `src/components/public-site/brand-image.tsx` (new) | `BrandImage({ brand, presentation, decorative })`: 16:9 or 1:1 box, `object-fit: cover` with the registry crop position, `next/image` with responsive `sizes`, the conceptual caption. Inside a link the image is decorative (empty alt, caption hidden from assistive technology) so the link keeps its text as its name. |
| Home | `src/components/public-site/brand-grid.tsx` | Square photograph at the top of each brand card, inside the existing external link; canonical URL, measurement attributes, new-tab semantics, and `record.asset` (reserved for authentic marks) unchanged. |
| Shop & Services | `pages/shop.tsx` | Square photograph at the top of each of the four choice cards; action keys, support details, geography, and equal-height behaviour unchanged. |
| Our Businesses | `pages/operations.tsx` | The brand bento is replaced by four photograph cards linking to the internal brand routes through a stretched label link; the section heading is kept. The warehouse graphic no longer appears on this page. |
| Brand pages | `pages/brands.tsx` | The three store pages' wide split sections use their own brand photograph instead of the design-pass still lifes; the Clinics services split uses the clinic reception. Technology & fulfilment keeps its warehouse graphic. |
| Canaries | `public-boundary.test.ts` | `brand-image.tsx` joins the public-component set (no raw hex, no raw `img`, no `https://`, no `/lsh/` literal in the grid); the mapping covers all four keys; the served files are JPEG derivatives, never the PNG masters; the brand grid keeps its photograph decorative; the three square placements are asserted. `graphics.test.ts` (unchanged) verifies existence, real dimensions, the 400 KB budget, the "Conceptual" alt prefix, the provenance phrase, and no brand or person-role words in alt text. |

Destinations were not changed: `lifesupply.ca`, `wellmartmedical.com`, `balkowitsch.com`, and `www.lifesupplyclinics.com` remain the verified canonical links; the internal brand routes are unchanged.

## Editorial guards

- Every placement carries the "Conceptual image" caption; alt text calls each image conceptual.
- The Balkowitsch image's synthetic person is described only as "a person packing medical supplies"; nothing names an employee.
- The clinic reception is described only as "a contemporary clinic reception area"; nothing calls it an owned clinic or a completed project.
- No inventory, facility, staffing, or service claim is attached to any image.

## Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database used by the public build.

| Check | Result |
| --- | --- |
| `pnpm format:check`, `pnpm typecheck`, `pnpm lint` | Pass |
| `pnpm test` | Pass (see the PR for the file and test counts) |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` | See `evidence/brand-photos/playwright-public.txt` |
| Captures | `evidence/brand-photos/`: Home, Shop & Services, Our Businesses, and the four brand pages at 390, 768, and 1440 px under reduced motion; the script asserted no console error, no horizontal overflow, and no broken image. |

Crop review: the supplies arrangement, rollator, packing person, and clinic reception remain intelligible in the square crops at all three widths (see the captures).

## Not done

- No WebP/AVIF derivatives were exported: `next/image` serves optimised formats from the JPEG derivatives through the default loader, which `next.config.ts` does not disable.
- No external-site, domain, DNS, or indexing change.
