/**
 * Corporate identity and shell copy. Approved as already published; see
 * docs/website-development/SOURCE_REGISTER.md (S-13, S-20, S-130, S-131).
 *
 * The Surrey address is the corporate address for the whole group, confirmed
 * by the product owner on 2026-09-10, which closes WEB-01 and supersedes the
 * different office address some operating websites show (S-21). Every address
 * on this site points here.
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
