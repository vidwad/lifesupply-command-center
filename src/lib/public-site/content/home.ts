/**
 * Homepage copy. Since 2026-09-11 the page is: hero, experience and
 * direction, the program architecture, the operating-context band, the
 * reported figures, footprint and milestones, the operating base, the
 * brands, growth direction, the developing opportunities, and contact. The
 * About sections come from `about.ts`; this file holds the rest.
 *
 * Provenance is recorded beside each block. "Approved" blocks were already
 * published before Stage 2. Blocks marked "Stage 2 draft" are new sentences
 * written from the development guide's operating model (§2) and the
 * verified facts in SOURCE_REGISTER.md; they introduce no figure, partner,
 * approval, or availability that the register does not support, and they
 * are listed for product-owner review in STAGE_02_EVIDENCE.md. Actions are
 * registry keys (actions.ts), never raw destinations.
 */
export const homepage = {
  /**
   * Hero. Rewritten in the website improvement program (2026-09-09) so the
   * first screen states what the group operates today and what it is
   * developing, and so clinic-service geography is not conflated with the
   * stores' commerce geography. Drafted with Codex against the evidence
   * register; no new claim is introduced.
   */
  eyebrow: "LifeSupply Health Inc.",
  title: "A health and medical supplies & services company.",
  /**
   * The product owner proposed the prior site's own line here on
   * 2026-09-12 -- "over 55,000 medical products ... over 45,000 Canadians
   * since inception" -- which is S-44 in the source register. The old
   * site stated those two facts four different ways (S-43 to S-47:
   * 46,000, 45,000 and 30,000 customers; 50,000 and 55,000 products), and
   * the register marks them unreliable. Shown that record, the product
   * owner chose the figures the 2025 annual report supports instead
   * (S-41, S-42), which are the ones the band further down the page
   * already cites. "Served ... since inception" keeps S-42's
   * qualification: it is cumulative, never a count of current customers.
   */
  description:
    "LifeSupply is an online retailer of more than 50,000 medical products, with more than one million customers served since inception.",
  /**
   * Background footage for the hero: the legacy lifesupplyhealth.com hero
   * video (wp-content/uploads/2021/10/LSHomeVid.mp4, 19 s, 1488×836), cut
   * to its two caption-free scenes (instruments flat-lay 9.75–11.75 s and
   * tablet 16–18.2 s), slowed 2.5× with motion interpolation, desaturated,
   * and cross-faded into a seamless 8.9 s loop at 1280×720. The city scene
   * and every captioned stretch were dropped: they carry the old mark and
   * figures that are not approved copy. Decorative only; no copy lives in
   * the footage. The poster is the loop's first frame.
   */
  heroMedia: {
    webm: "/lsh/hero/hero-loop.webm",
    mp4: "/lsh/hero/hero-loop.mp4",
    poster: "/lsh/hero/hero-poster.jpg",
    posterWidth: 1600,
    posterHeight: 900,
  },

  /**
   * Who we are, where we are going, where we want to be. Product owner,
   * 2026-09-09, after the prior site's three-panel statement. The wording
   * was drafted with Codex under the site's rules and edited here: "a
   * decade" became the approved "more than 25 years" (2025 annual-report
   * narrative); "growing annually, organically and through acquisition"
   * became strategy and objective; the third panel, blank on the prior
   * site, was written from the approved vision and direction copy. The
   * founding-investor description is kept as a description of that base.
   * Nothing here states a growth rate, a transaction, or a ranking as fact.
   */
  whoWeAre: {
    eyebrow: "Experience and direction",
    title: "Who we are and where we are going.",
    /**
     * The standfirst (product owner, 2026-09-12). Same facts the hero
     * carried before the title changed: four businesses, three selling
     * online in two countries and one delivering clinic projects in
     * British Columbia, with two supply programs still in development.
     */
    description:
      "Four operating businesses under one group. Three sell medical, health, and home-care supplies online across Canada and the United States; the fourth plans, designs, and equips clinics for projects in British Columbia. Two further supply programs, in pharmacy and metabolic health, are in development.",
    panels: [
      {
        eyebrow: "Our record",
        headline: "Experienced",
        text: "More than 25 years of operations, built up by acquisition. Wellmart Health Supplies became the Canadian operating base in 2020, and Balkowitsch Enterprises added United States reach and a distributor network in 2023. Today those businesses sell medical, health, and home-care supplies online across Canada and the United States, and plan, design, and build clinics for projects in British Columbia.",
      },
      {
        eyebrow: "Our strategy",
        headline: "Growing",
        text: "The strategy is to build on the existing business through operating discipline, technology, and complementary acquisitions. The objective is to bring strategically located medical supply stores, pharmacies, clinics, and distributors into the group, and to widen what can be offered online in Canada and the United States.",
      },
      {
        eyebrow: "Our ambition",
        headline: "Connected",
        text: "The ambition is to become a global leader in the online sale and distribution of health and medical products and related services. That means deeper clinic relationships, recurring patient-support supply programs, and commerce, clinic-development, and equipment capabilities working together for a broader customer base over time.",
      },
    ],
  },

  // Approved (moved from JSX in PR #61). Verified proof, with source context.
  glance: {
    eyebrow: "LifeSupply at a glance",
    title: "Scale, as the 2025 annual report states it.",
    description:
      "The 2025 annual-report narrative cites the figures below. Read them with the qualifications that report states.",
  },
  publicMetrics: [
    { value: "25+", label: "years of operations cited in the 2025 annual report" },
    { value: "50K+", label: "products cited in the 2025 annual report" },
    {
      value: "1M+",
      label: "customers served cumulatively since inception, cited in the 2025 annual report",
    },
  ],

  // Stage 2 draft. Section heading only; the cards come from the brand registry.
  brands: {
    eyebrow: "Operating brands",
    title: "Four businesses, each with its own customers.",
    description:
      "LifeSupply Health is the corporate group; nothing is sold on this site. Each brand runs its own storefront or service site, with its own accounts, currency, prices, and customer support.",
  },

  // Stage 2 draft heading; the channels are the approved directory.
  closing: {
    eyebrow: "Contact",
    title: "Reach the right person.",
  },

  /**
   * Retained from the first restoration pass for the red information band.
   * A restatement of `description`; not a new claim.
   */
  operatingContext: {
    eyebrow: "What the stores sell",
    statement:
      "Health, safety, medical, and industrial supplies, sold online across Canada and the United States.",
  },
} as const;
