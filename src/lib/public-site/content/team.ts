/**
 * Team copy.
 *
 * Reconciled in Stage 5 (WB-505) to the dated legacy profiles. Reduced on
 * 2026-09-08 at the product owner's direction to Abdul Ladha alone; on
 * 2026-09-09 the product owner restored the board as the prior site showed
 * it (Abdul Ladha, Keith Dolo, Barrett Sleeman, Dr. David Vogt), with the
 * portraits and biographies copied over from that site (S-100, S-153 to
 * S-155). Everyone else listed on the prior site remains withdrawn; their
 * addresses redirect to the team page (next.config.ts; `withdrawnProfileSlugs`
 * below keeps the list in one place for the public-host allowlist). The dated
 * 2022 announcements in the newsroom and milestones are historical records
 * and are unchanged.
 *
 * Biographies are the prior site's text. Two slips in that text were
 * corrected without changing its meaning: a missing "and" in Keith Dolo's
 * last sentence and a missing "a" in Dr. Vogt's first.
 */
export const team = {
  /**
   * One section, not two (product owner, 2026-09-12). Abdul Ladha appeared
   * twice on the page: once as Leadership and again as the first director.
   * He now appears once, with his full title.
   */
  hero: {
    eyebrow: "Leadership and governance",
    title: "The people guiding LifeSupply.",
    description:
      "LifeSupply’s leadership and board bring experience in business operations, finance, capital markets, engineering, technology, and innovation.",
  },
  labels: {
    management: "Leadership",
    board: "Our Board of Directors",
    profiles: "Full profiles",
  },
  management: [
    {
      name: "Abdul Ladha",
      slug: "abdul-ladha",
      /** Already published on this site beside the company video. */
      role: "Chairman & CEO",
      summary:
        "Electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience.",
      image: "/lsh/abdul-ladha.jpg",
    },
  ],
  /** The board as the prior site listed it (S-100), each linked to the preserved profile. */
  board: [
    {
      name: "Abdul Ladha",
      slug: "abdul-ladha",
      summary:
        "Electrical engineer, entrepreneur, and business leader with three decades of business and capital-market experience.",
      linkLabel: "Read Abdul’s biography",
      image: "/lsh/abdul-ladha.jpg",
    },
    {
      name: "Keith Dolo",
      slug: "keith-dolo-2",
      summary:
        "Business leader with experience in finance, accounting, corporate leadership, and investment in growing e-commerce businesses.",
      linkLabel: "Read Keith’s biography",
      image: "/lsh/keith-dolo.jpg",
    },
    {
      name: "Barrett E.G. Sleeman, P.Eng.",
      slug: "barrett-e-g-sleeman",
      summary:
        "Professional engineer with experience in banking, financial analysis, resource development, and public-company leadership.",
      linkLabel: "Read Barrett’s biography",
      image: "/lsh/barrett-sleeman.jpg",
    },
    {
      name: "Dr. David Vogt",
      slug: "david-vogt",
      summary:
        "Scientist and innovation leader with experience spanning technology ventures, research, education, and corporate governance.",
      linkLabel: "Read David’s biography",
      image: "/lsh/david-vogt.jpg",
    },
  ],
  /**
   * The four retained biographies. Each was a page of its own until
   * 2026-09-10, when the website consolidation merged them into `/our-team`
   * as sections: four addresses that each held one person's biography, with
   * the board listing above them that a reader had to come back to.
   *
   * `anchor` is the section each address now redirects to. It is stated
   * rather than derived from the slug because two of the four slugs are
   * legacy artefacts — `keith-dolo-2` and `barrett-e-g-sleeman` — and an
   * anchor should read as the person's name, not as the accident of how the
   * prior site numbered its URLs.
   */
  legacyProfiles: [
    {
      anchor: "abdul-ladha",
      slug: "abdul-ladha",
      name: "Abdul Ladha",
      role: "Chairman & Chief Executive Officer",
      image: "/lsh/abdul-ladha.jpg",
      bio: [
        "Abdul Ladha is an electrical engineer, entrepreneur, business leader, and philanthropist with three decades of business and capital-market experience.",
        "He served as Chairman and Chief Executive Officer of Ableauctions.com Inc., leading the development and deployment of live auction technology and services for galleries and industrial auction houses.",
        "Abdul founded the Spark Global Philanthropic Foundation and has taught periodically at the University of British Columbia’s Sauder School of Business.",
      ],
    },
    {
      anchor: "keith-dolo",
      slug: "keith-dolo-2",
      name: "Keith Dolo",
      role: "Director",
      image: "/lsh/keith-dolo.jpg",
      bio: [
        "Keith Dolo holds an honours degree in commerce and has experience in finance, accounting, and corporate leadership.",
        "He spent eight years as a Vice President at Robert Half International and has served as Chairman and Chief Executive Officer of Sproutly Canada.",
        "Keith is also a co-founder of Maverick Brands, a brand accelerator that invests in growing e-commerce companies.",
      ],
    },
    {
      anchor: "barrett-sleeman",
      slug: "barrett-e-g-sleeman",
      name: "Barrett E.G. Sleeman, P.Eng.",
      role: "Director",
      image: "/lsh/barrett-sleeman.jpg",
      bio: [
        "Barrett Sleeman is a Professional Engineer whose career spans resource development, finance, and public-company leadership.",
        "His experience includes supervising a $5 billion loan portfolio for the Royal Bank of Canada, working as a financial analyst for a national brokerage firm, and serving as an officer and director of numerous public companies.",
        "Barrett is also a retired emergency medical technician and first responder.",
      ],
    },
    {
      anchor: "david-vogt",
      slug: "david-vogt",
      name: "Dr. David Vogt",
      role: "Director",
      image: "/lsh/david-vogt.jpg",
      bio: [
        "Dr. David Vogt is a Vancouver-based scientist and innovation leader with experience across academic, government, corporate, non-profit, and startup organizations.",
        "He holds an interdisciplinary Ph.D. from Simon Fraser University, a Bachelor of Arts in English Literature, and an Honours Bachelor of Science in Astrophysics from the University of British Columbia.",
        "His career includes launching ten information technology companies and founding and leading collaborative innovation organizations focused on mobile media and urban data solutions.",
        "Dr. Vogt’s experience also includes advisory and governance roles and graduate-level teaching at the University of British Columbia.",
      ],
    },
  ],
  /** Withdrawn profile addresses (2026-09-08); each redirects to `/our-team/`. */
  withdrawnProfileSlugs: [
    "ross-jelveh",
    "ross-jelveh-2",
    "ben-hastibakhsh",
    "gary-li",
    "craig-loverock",
    "mike-gill",
    "christopher-ishola",
    "dr-margaret-clarke-2",
    "dr-dedeshya-holowenko",
    "john-anderson-2",
  ],
  /**
   * Unpublished since 2026-09-12 (product owner): an internal note about how
   * the copy was preserved is not page copy. It was needed while the
   * biographies were the prior site's text, which asserted current roles --
   * "is currently CEO of two of these", "is a director of THEMAC Resources
   * Group". The rewritten biographies state career history in the past tense
   * and make no claim about a role held today, so the caveat has nothing
   * left to qualify.
   */
  profileNote:
    "This preserved biography and title are from the prior public website. Current roles are confirmed through the company before a profile is updated.",
} as const;

export type LegacyProfile = (typeof team.legacyProfiles)[number];

/** The dated legacy title for a slug; every card and board entry resolves through here. */
export function legacyTitle(slug: string): string {
  return legacyProfile(slug).role;
}

/** The full preserved record for a slug. Throws rather than render a blank card. */
export function legacyProfile(slug: string): LegacyProfile {
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) throw new Error(`No legacy profile for ${slug}`);
  return profile;
}

/** The anchor a person's section answers on, for links and for the redirect map. */
export function profileAnchor(slug: string): string {
  return legacyProfile(slug).anchor;
}

/** Every anchor the team page publishes, in the order the page renders them. */
export const PROFILE_ANCHORS = team.legacyProfiles.map((profile) => profile.anchor);
