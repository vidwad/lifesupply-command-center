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
  /**
   * What the group is and what it does, above the panels (product owner,
   * 2026-09-12). Every fact here is already carried elsewhere on the site:
   * the stores and their two countries, the clinic services and their
   * province, and the two programs in development with their status intact.
   */
  whoWeDo: {
    eyebrow: "Who are we and what we do",
    title: "Medical supplies and clinic services across Canada and the United States.",
    paragraphs: [
      "LifeSupply Health brings together online medical and home-care supply businesses serving Canada and the United States, alongside clinic planning, design, construction, and equipment services for projects in British Columbia.",
      "We are building on these operations through technology, complementary acquisitions, and the development of pharmacy and metabolic-health supply programs.",
    ],
  },

  whoWeAre: {
    eyebrow: "Experience and direction",
    title: "An established business. A clear direction for growth.",
    /**
     * The standfirst (product owner, 2026-09-12). Same facts the hero
     * carried before the title changed: four businesses, three selling
     * online in two countries and one delivering clinic projects in
     * British Columbia, with two supply programs still in development.
     */
    description:
      "LifeSupply’s strategy builds on the operating history, customer relationships, and supply capabilities of its businesses.",
    panels: [
      {
        eyebrow: "Our record",
        headline: "Experienced",
        text: "LifeSupply brings together businesses with more than 25 years of operating history. The acquisition of Wellmart Health Supplies in 2020 established the group’s Canadian operating base. The acquisition of Balkowitsch Enterprises in 2023 extended its customer reach and distributor relationships into the United States.",
      },
      {
        eyebrow: "Our strategy",
        headline: "Growing",
        text: "Our strategy combines stronger performance in the existing businesses, better ordering and fulfilment technology, and selective acquisitions. We seek complementary operations that broaden our product range, extend our market reach, and deepen relationships with healthcare customers.",
      },
      {
        eyebrow: "Our ambition",
        headline: "Connected",
        text: "Our ambition is to build lasting supply relationships with clinics, pharmacies, and the patients they support. Over time, we aim to connect the group’s commerce, clinic-development, and equipment capabilities with new patient-supply and fulfilment services.",
      },
    ],
  },

  // Approved (moved from JSX in PR #61). Verified proof, with source context.
  glance: {
    eyebrow: "LifeSupply at a glance",
    title: "The scale of our operating businesses.",
    /**
     * The source and the cumulative qualification moved out of a standfirst
     * and under the figures themselves (product owner, 2026-09-12), so the
     * caveat sits with the numbers rather than above them.
     */
    source:
      "Source: LifeSupply’s 2025 Annual Report. Customer figures are cumulative and do not represent current active customers.",
  },
  /**
   * The unit sits beside the figure rather than inside it, so the numeral
   * still carries the band at display size while the line reads "25+ years"
   * (product owner, 2026-09-12). The source and the cumulative qualification
   * are carried once, by `glance.source`, beneath all three.
   */
  publicMetrics: [
    {
      value: "25+",
      unit: "years",
      label: "Operating history across the group’s businesses.",
    },
    {
      value: "50,000+",
      unit: "products",
      label: "Reported product range across the group.",
    },
    {
      value: "1M+",
      unit: "customers served",
      label: "Cumulative customers served since inception.",
    },
  ],

  // Stage 2 draft. Section heading only; the cards come from the brand registry.
  brands: {
    eyebrow: "Operating brands",
    title: "Four brands serving distinct supply and clinic needs.",
    description:
      "Our three online stores and clinic-services business serve medical, home-care, professional, safety, and industrial supply needs across their respective markets.",
    /**
     * Unpublished since 2026-09-12 (product owner), the same day it was
     * added. Kept on the record. The boundary it stated still holds: nothing
     * is sold on this site, and each business keeps its own accounts,
     * currency, prices and support. Every card links out to the business
     * that takes the order, which is what carries it now.
     */
    note: "Shop or enquire directly with the relevant brand. Each business manages its own ordering and customer-service arrangements.",
  },

  // Stage 2 draft heading; the channels are the approved directory.
  /**
   * The contact section (product owner, 2026-09-12). The three routes each
   * say who they are for, and the closing line sends order questions to the
   * store that took the order, because nothing is sold on this site.
   */
  closing: {
    eyebrow: "Contact LifeSupply",
    title: "Start the right conversation.",
    lead: "Contact us about investor information, acquisition opportunities, or the group’s supply and clinic services.",
    note: "For assistance with an existing order, please contact the store where you made your purchase.",
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
