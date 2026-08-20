# Product Studio — Researched Product Listings and Image Drafts

**Status:** Product-owner-authorized feature slice; review-only and default-off

**Route:** `/products/studio`

**Owners:** Product Manager (workflow), Developer / Technical Admin (provider and worker), Product Owner (activation and retention)

## 1. Outcome

Product Studio turns one to four user-supplied product photographs plus a working title and short
description into a durable, reviewable project containing:

- exact-product identity analysis grounded in the uploaded photographs;
- an original improved listing title and short description;
- current seller-source records and normalized asking-price observations;
- a cited low/high market range with currency, condition, and methodology;
- four distinct product-photo composition briefs;
- one compiled high-fidelity image-edit prompt per composition;
- four generated draft images, produced one at a time;
- automated identity, condition-fidelity, composition, and text-integrity QA;
- human approval/rejection state for every generated image; and
- complete AI prompt, output, source-reference, model, token, actor, and audit records.

The feature does **not** publish to BigCommerce, change a product price, copy a competitor image,
send a campaign, or post to a social network.

## 2. Workflow

1. A Product Manager opens an existing catalog product in Product Studio or starts a standalone
   project.
2. The user supplies a title, short factual description, and one to four JPEG/PNG/WebP photographs.
3. The application stores the photographs as the authoritative identity/condition evidence.
4. The user explicitly queues research. The worker uses OpenAI Responses web search and strict
   structured output to identify the exact product, collect seller/price evidence, and derive four
   composition patterns.
5. The application stores seller pages and reference-image URLs, but not competitor image bytes.
6. The prompt compiler combines the confirmed product identity, truthful condition notes, and one
   composition brief. It explicitly forbids model substitution, invented defects/accessories, and
   retailer-specific creative copying.
7. The user queues one composition at a time. The worker sends only the user's source photos and the
   compiled prompt to the OpenAI Images edit API with high input fidelity.
8. The worker compares each generated image with the authoritative photographs using a structured QA
   pass. A human must still approve or reject the result.
9. After four drafts are approved, the project status becomes `approved`. This means approved inside
   Command Center only; no external publishing path exists in this slice.

## 3. What “most effective” means

Retailers generally do not publish image-level conversion data. Product Studio therefore treats
“effective” as a transparent proxy based on:

- how frequently a composition appears across credible sellers;
- product clarity at thumbnail and detail-view sizes;
- completeness and ability to inspect condition;
- visual hierarchy and premium presentation;
- distinct usefulness within a four-image listing set; and
- compatibility with the exact physical item supplied by the user.

The model is instructed never to claim access to private seller conversion data. The methodology and
warnings are stored with each project.

## 4. Pricing rules

- Store every observation with seller, direct URL, asking price, currency, stated condition, and
  observation timestamp.
- Keep incompatible generations, variants, bundles, and conditions out of the range.
- Normalize the displayed range to one currency and retain the original observation currency.
- Present the result as an asking-price range, not an appraisal, realized-sale guarantee, or pricing
  instruction.
- Re-run research for stale projects by creating a new project; historical evidence remains intact.

## 5. Security and governance

| Control | Implementation |
|---|---|
| Access | `products.update` and `ai.use` are required server-side. |
| Intake switch | `product_studio.enabled`, default off. |
| Spend switch | `product_studio.image_generation`, default off and included in the global kill switch. |
| Provider keys | Resolved server-side from environment or encrypted credential vault. |
| Source authority | Uploaded photographs are explicitly identified as the sole authoritative visual source. |
| Prompt injection | Web pages are labelled untrusted data; their instructions must be ignored. |
| Provenance | Seller URLs, price observations, prompts, model names, hashes, actors, and timestamps are stored. |
| External actions | None. BigCommerce updates and social publishing are out of scope. |
| Human review | Generated assets remain `needs_review` or `rejected` until a permitted user acts. |
| Audit | Project creation, research queue/result/failure, generation queue/result/failure, and review are logged. |

## 6. Data model

- `ProductStudioProject` — intake, final listing copy, market summary, status, warnings.
- `ProductStudioAsset` — authoritative and generated image bytes, SHA-256 hash, prompt, model, QA,
  and review state.
- `ProductStudioResearchSource` — seller/product-page evidence and external hero-image URL.
- `ProductStudioPriceObservation` — normalized source-linked price evidence.
- `ProductStudioComposition` — four structured composition briefs and compiled prompts.
- `AiOutput` — complete research and image-QA invocation records.
- `AuditLog` — material user and workflow events.

This MVP uses PostgreSQL byte storage for bounded image payloads. Before broad production usage,
move asset bytes to the configured private S3-compatible bucket while retaining immutable hashes and
metadata in PostgreSQL. The schema is intentionally isolated from the BigCommerce-synchronized
`Product` source-of-truth fields.

## 7. Environment and activation

Required:

- `OPENAI_API_KEY` in Render secrets or the encrypted integration vault;
- `OPENAI_MODEL` set to a Responses-compatible multimodal model with web search support, or the
  application default;
- `OPENAI_IMAGE_MODEL=gpt-image-2` unless a tested compatible replacement is approved;
- healthy web, worker, database, and Inngest services; and
- migration `20260819000000_product_studio_mvp` applied in staging first.

Activation order:

1. Run migration rehearsal and a backup/restore check in staging.
2. Seed/update governance rows so both Product Studio flags appear.
3. Confirm the Product Manager role has `products.update` and `ai.use`.
4. Enable `product_studio.enabled` in staging.
5. Run a research-only test with synthetic/non-sensitive product data.
6. Set a provider budget and enable `product_studio.image_generation` in staging.
7. Generate one composition, inspect source fidelity and audit records, then continue through four.
8. Complete product-owner UAT before any production activation.

Product Studio requests a 2048 × 2048 square edit from `gpt-image-2`, which supports arbitrary
dimensions within its published limits. Channel-specific derivatives should still be generated by a
separate loss-aware crop/export pipeline rather than repeatedly regenerating the product.

## 8. Acceptance tests

- Reject missing, unsupported, oversized, or more than four source images.
- Reject an inverted market range and any result without unique slots 1–4.
- Reject research replacement after generation so provenance cannot be silently rewritten.
- Block generation unless both Product Studio flags are on.
- Block concurrent composition generation for the same project.
- Reuse an existing generated slot rather than duplicating a completed asset.
- Require authentication and `products.view` for asset bytes.
- Confirm the global kill switch disables image generation.
- Confirm prompts preserve authoritative product identity and forbid invented condition/accessories.
- Confirm every generated image has QA and human review state.

## 9. Next phase: social campaign derivatives

Build social output only after this review workflow passes staging UAT. The next slice should:

1. select only approved Product Studio assets;
2. create channel-safe crops/derivatives for Instagram feed and stories, Facebook, Pinterest, and
   paid-social placements without regenerating the product itself;
3. draft platform-specific copy, hooks, alt text, UTM-tagged destination URLs, and disclosure labels;
4. store a versioned campaign brief linking every derivative back to its approved source asset;
5. require Marketing Manager approval and current CASL/privacy policy where audiences are involved;
6. export drafts to a controlled destination first—never auto-publish in the initial release;
7. capture campaign IDs and GA4/commerce outcomes so future composition ranking can use actual
   LifeSupply performance rather than retailer-prevalence proxies; and
8. retain a kill switch, audit log, budget limit, and rollback path for every external channel.

## 10. Known production-readiness follow-ups

- Move image bytes to private object storage and define lifecycle/retention policy.
- Add per-user and per-project generation budgets, provider cost estimates, and spend alerts.
- Add stale-price detection and scheduled research refresh that creates a new version.
- Add malware/content scanning and image-dimension/EXIF validation at upload.
- Add download/export renditions only after approved storage and retention controls exist.
- Add a side-by-side visual-difference reviewer for source versus generated images.
- Validate OpenAI model and image API behaviour in staging whenever model configuration changes.
