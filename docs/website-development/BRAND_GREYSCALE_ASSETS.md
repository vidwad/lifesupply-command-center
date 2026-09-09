# Greyscale brand image handoff

## Stage progress
Stage 1 inspection is complete. Read [BRAND_GREYSCALE_STAGE_1.md](BRAND_GREYSCALE_STAGE_1.md) for exact component mappings, image-format constraints, and the Stage 2 prompt.

## Start here
Read the repository-root `CLAUDE.md` and `docs/website-development/CLAUDE.md` first, then this file. These assets are committed on branch `assets/brand-greyscale-banners`. If this handoff is absent from your checkout, fetch and check out that branch, or use main after its pull request is merged. Preserve local work when switching branches.

## Scope and authorization
The user requested black-and-white/greyscale versions of four previously generated brand images and storage in GitHub for Claude Code. This asset delivery adds files only. Website integration is the next development task. Follow the repository's branch, review, and deployment instructions.

## Files
All four landscape source images are PNG, 1672 × 941 pixels. Paths below are relative to the repository root; browser URLs omit `public`.

| Brand | File | Suggested crop position |
| --- | --- | --- |
| LifeSupply | `public/lsh/graphics/brands/lifesupply-greyscale-v1.png` | `50% 50%` |
| Wellmart Medical | `public/lsh/graphics/brands/wellmart-medical-greyscale-v1.png` | `50% 50%` |
| Balkowitsch | `public/lsh/graphics/brands/balkowitsch-greyscale-v1.png` | `50% 50%` |
| LifeSupply Clinics | `public/lsh/graphics/brands/lifesupply-clinics-greyscale-v1.png` | `55% 50%` |

Machine-readable metadata, alt text, and provenance are in `public/lsh/graphics/brands/manifest.json`.

## Integration stages
Complete one stage at a time and report its outcome before beginning another.

### Stage 1 — Inspect and map
Locate the existing brand cards, related-site calls to action, banner components, and image registry. Map each asset to its corresponding brand. Review existing approved destination URLs; this task does not change them. Do not infer domain redirects from earlier spelling variants. Report exact component changes planned.

### Stage 2 — Integrate
Use these assets for their corresponding brand banner or CTA image. Extend the existing typed image registry if appropriate, with the provenance in this handoff. Do not reuse the older registry's Gamma-generation provenance for these new assets.

Keep brand titles, descriptions, and CTA buttons as accessible HTML outside the image. Images contain no logos or text. Use the supplied alt descriptions where informative; use empty alt when the image is purely decorative and adjacent text already supplies its meaning.

For landscape displays, preserve the source ratio or use a 16:9 container with object-fit: cover. For square CTA cards, use the same source inside an aspect-ratio: 1 / 1 container with object-fit: cover and the suggested object-position from the manifest. These are starting crop positions requiring visual review, not separately exported square files. Do not stretch images.

The PNGs are approximately 1.7–2.2 MB each. Before serving in production, use the project's existing image optimization pipeline or create appropriate WebP/AVIF derivatives, retaining these PNG masters. Supply responsive sizes, explicit dimensions, and lazy loading for below-the-fold cards. Prioritize only an actual above-the-fold hero image. Keep the neutral greyscale appearance; avoid applying the older red-tint treatment.

### Stage 3 — Verify and hand off
Check desktop and mobile banner and square layouts. Keep the rollator, packing person, supply arrangement, and clinic reception intelligible in their respective crops. Check alt text, brand-to-image mapping, destination links, layout stability, and loading behavior. Run the repository's relevant required checks when implementation changes are made. Summarize changed files and verification, then open or update the review PR according to repository instructions.

## Provenance and editorial use
These are AI-generated conceptual images, edited from the earlier colour concepts. They are not documentary photographs of LifeSupply, Wellmart Medical, Balkowitsch, or LifeSupply Clinics. The person in the Balkowitsch image is synthetic and must not be presented as an actual employee or customer. Retain the site's conceptual-image caption convention where applicable. Do not attach claims of specific inventory, facilities, staffing, or services based on these images.

## Suggested first Claude Code prompt
Read `CLAUDE.md`, `docs/website-development/CLAUDE.md`, and `docs/website-development/BRAND_GREYSCALE_ASSETS.md`. The four greyscale images and their manifest are in `public/lsh/graphics/brands/`. Complete Stage 1 of the image handoff only: inspect the current brand banner and CTA components, map all four assets, and report the exact integration changes planned. Preserve existing work and follow repository instructions. Stop after Stage 1.
