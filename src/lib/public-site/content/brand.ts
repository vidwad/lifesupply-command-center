/**
 * Corporate identity and shell copy. Approved as already published; see
 * docs/website-development/SOURCE_REGISTER.md (S-13, S-20, S-130, S-131).
 *
 * The address is the one the repository has published since consolidation.
 * The operating websites show a different office address (S-21); WEB-01
 * decides which is current. Until then the published one stands.
 */
export const brand = {
  name: "LifeSupply Health",
  /**
   * Official LifeSupply logo, supplied by the product owner on 2026-09-08:
   * white wordmark, red angular device with grey speed lines, transparent
   * ground. The 821×262 export was trimmed to its opaque 661×93 box (a 1:1
   * pixel copy, no resampling) so the artwork fills the box next/image
   * reserves. Legible only on ink/charcoal — never place it on paper
   * (docs/40 asset policy). Replaces the earlier 169×28 export.
   */
  image: "/lsh/lifesupply-mark.png",
  imageWidth: 661,
  imageHeight: 93,
  address: [
    "LifeSupply Health Inc.",
    "6911 King George Highway",
    "Surrey, British Columbia V3W 5A1",
    "Canada",
  ],
  // moved from JSX (footer)
  footerTagline:
    "Corporate information, operating context, and investor resources from LifeSupply Health Inc.",
  // moved from JSX (footer)
  legalNotice: "Information on this site is current at the date published and may be updated.",
} as const;
