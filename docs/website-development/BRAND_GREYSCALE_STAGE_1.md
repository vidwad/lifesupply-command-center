# Brand greyscale images — Stage 1 inspection

Date: 2026-09-09
Status: Ready for Review — inspection and mapping complete; runtime integration pending.
Reviewed main: bf5aa1a042b09e1ae7c905a00eac440514037e79
Asset branch: assets/brand-greyscale-banners
Asset commit reviewed: 1c6f942d59bc166c35f8970eaff42b8693f866ea
Review: https://github.com/vidwad/lifesupply-command-center/pull/86

This is Stage 1 of the image handoff, not a repeat of the completed website Stage 1. Read BRAND_GREYSCALE_ASSETS.md alongside this inspection.

## Exact brand mapping

| Registry key | PNG master under public/lsh/graphics/brands/ | Proposed GraphicKey | Square position |
| --- | --- | --- | --- |
| lifesupply | lifesupply-greyscale-v1.png | brandLifeSupply | 50% 50% |
| wellmart | wellmart-medical-greyscale-v1.png | brandWellmart | 50% 50% |
| balkowitsch | balkowitsch-greyscale-v1.png | brandBalkowitsch | 50% 50% |
| clinics | lifesupply-clinics-greyscale-v1.png | brandClinics | 55% 50% |

The manifest's asset identifiers are filenames, not necessarily BrandKey values. Map explicitly: wellmart-medical -> wellmart and lifesupply-clinics -> clinics. Do not cast those filename identifiers to BrandKey.

## Component changes planned for Stage 2

1. **src/lib/public-site/graphics.ts**: register four optimized JPEG derivatives with their true dimensions, conceptual alt descriptions, and distinct image-generation provenance. Add a typed mapping covering OperatingBrandKey. Add optional crop-position metadata if shared rendering needs it. Correct the registry header so the earlier Gamma/no-person description applies only to that older set. Retain the older assets and provenance.
2. **src/components/public-site/brand-image.tsx** (new): a small shared next/image wrapper accepting an operating brand and square/landscape presentation. Read the typed mapping, reserve aspect ratio, apply object-fit: cover and the specified crop position. Include the existing conceptual caption convention. No names or CTA copy embedded into raster images.
3. **src/components/public-site/brand-grid.tsx**: add a square image above each brand's text and CTA. This reaches the homepage through its existing BrandGrid import. Preserve its canonical external URL, measurement attributes, focus behavior and new-tab semantics. Keep brand.asset reserved for authentic logos; these images are not logo replacements.
4. **src/components/public-site/pages/shop.tsx**: add the shared square image above each of the four Shop & Services CTA blocks. Preserve current action keys, support details, geography and equal-height card behavior.
5. **src/components/public-site/pages/operations.tsx**: replace only the four brand tiles with square-image cards linking to their existing internal BRAND_ROUTES. Keep the section heading and surrounding corporate/capability content. Prefer the shared brand-image component over modifying generic BentoGrid behavior for every page.
6. **src/components/public-site/pages/brands.tsx**: replace the three STORE_GRAPHICS assignments with the new brand-specific graphics. Replace the Clinics services SplitSection examRoom graphic with brandClinics. These existing wide image sections provide landscape use without adding duplicate hero images. The technology/fulfilment warehouse illustration is unrelated and retains its current graphic.
7. **docs/website-development/STATUS.md** and this handoff: record integration evidence as a bounded image follow-up, not a reopened website implementation stage. Preserve existing release and domain blockers.

Review all current callers before editing if main has moved since this inspection.

## Delivery format finding

The PNG masters are 1672 x 941 and approximately 1.7–2.2 MB each. Existing graphics.test.ts reads JPEG markers and requires every registered delivery asset to be below 400 * 1024 bytes. It also requires alt text to begin with Conceptual and provenance to contain "conceptual, not operational photography".

For the smallest compatible change, export matching .jpg delivery copies under the same brands folder, retain neutral greyscale, preserve the master aspect ratio, and optimize to below the existing budget with visual inspection. Register the JPEGs, not the PNG masters. Do not weaken the test or mislabel PNG bytes with a .jpg extension. The current next.config.ts does not disable image optimization; continue using next/image with responsive sizes.

Suggested alt descriptions:
- Conceptual arrangement of medical supplies and monitoring equipment on a counter.
- Conceptual image of a rollator in a bright home interior.
- Conceptual image of a person packing medical supplies at a warehouse workstation.
- Conceptual image of a contemporary clinic reception area and corridor.

The synthetic person must not be identified as an actual employee. The clinic reception must not be described as an actual owned clinic or completed project.

## Stage 2 acceptance and verification

- All four assets map correctly in Home, Shop & Services, Our Operations and their individual brand pages.
- Square photos sit above readable HTML CTA content. Landscape sections preserve image composition.
- At 390px, 768px and 1440px, check cropping, card alignment, focus, caption readability and horizontal overflow.
- Preserve the approved lifesupply.ca, wellmartmedical.com, balkowitsch.com and lifesupplyclinics.com destinations. This inspection checked repository mappings, not current external-site availability.
- Inspect optimized images at their intended display size. Confirm actual JPEG dimensions and byte sizes using the existing registry check.
- Run current required format, type, lint, test, public-build and normal-build checks for the code work; run builds sequentially. Review the existing browser suite before execution and avoid production form submissions.
- Record blocked checks honestly. No current visual/build pass is claimed by this documentation-only inspection.

## Verification performed in Stage 1

Read the current brand registry, graphics registry and tests, Home imports, BrandGrid, Operations, Shop, brand page templates, shared image section primitives, Next configuration, package scripts, and website status. Verified the existing image PR remains open and unmerged. Checked proposed edits against actual identifiers and components. No runtime code, deployment, migration or external-site change was made. Application tests and browser checks are deferred to the implementation stage because this change adds documentation only.

## Next Claude Code prompt

Read CLAUDE.md, docs/website-development/CLAUDE.md, docs/website-development/BRAND_GREYSCALE_ASSETS.md, and docs/website-development/BRAND_GREYSCALE_STAGE_1.md.

Complete Stage 2 of the image handoff only. Stage 1 inspection is complete. Reconcile current main and the asset PR #86 before choosing the implementation branch: follow the repository's predecessor/branch rules, and do not silently stack runtime changes on an unmerged predecessor. Implement the mapped square brand CTA images and wide brand-page images, create optimized JPEG derivatives while retaining the PNG masters, and preserve the existing image budget and conceptual provenance checks. Run the required implementation checks and responsive visual review, record evidence, push and open a review PR. Stop after Stage 2; do not merge or deploy.
