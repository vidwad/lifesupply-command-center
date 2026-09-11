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
  hero: {
    eyebrow: "Our team",
    title: "Leadership and board of LifeSupply Health Inc.",
    description:
      "The people who run the group and the directors who oversee it, across online medical supply in Canada and the United States, clinic projects in British Columbia, and the supply programs now in development.",
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
        "Abdul Ladha is an electrical engineer, entrepreneur, business leader and philanthropist. He has 30 years of business and capital market experience.",
      image: "/lsh/abdul-ladha.jpg",
    },
    {
      name: "Keith Dolo",
      slug: "keith-dolo-2",
      summary:
        "Keith Dolo holds an honors degree in commerce with an outstanding track record in finance and accounting.",
      image: "/lsh/keith-dolo.jpg",
    },
    {
      name: "Barrett Sleeman",
      slug: "barrett-e-g-sleeman",
      summary:
        "Barrett Sleeman is a Professional Engineer with a varied career history in resource development and finance.",
      image: "/lsh/barrett-sleeman.jpg",
    },
    {
      name: "Dr. David Vogt",
      slug: "david-vogt",
      summary:
        "Dr. David Vogt is a scientist and innovation leader based in Vancouver, Canada. He holds an Interdisciplinary Ph.D. (SFU 1990), a B.A. in English Literature (UBC 1978) and a Hons. B.Sc. in Astrophysics (UBC 1977).",
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
      role: "Chairman & CEO",
      image: "/lsh/abdul-ladha.jpg",
      bio: [
        "Abdul Ladha is an electrical engineer, entrepreneur, business leader and philanthropist. He has 30 years of business and capital market experience.",
        "He was the Chairman and CEO of Ableauctions.com Inc., leading the company’s development and deployment of live auction technology and services to some of the world’s most prestigious galleries and industrial auction houses.",
        "Abdul is the founder of the Spark Global Philanthropic Foundation and is periodically an instructor at the Sauder School of Business, University of British Columbia.",
      ],
    },
    {
      anchor: "keith-dolo",
      slug: "keith-dolo-2",
      name: "Keith Dolo",
      role: "Director",
      image: "/lsh/keith-dolo.jpg",
      bio: [
        "Keith Dolo holds an honors degree in commerce with an outstanding track record in finance and accounting. He served for 8 years as VP of Robert Half International, an S&P 500, NYSE ($6.1 billion) listed company, named by Fortune magazine in its “Most Admired Companies” list for 23 consecutive years. Keith has served as the chairman & CEO of Sproutly Canada and is the co-founder of Maverick Brands, a brand accelerator that invests in high growth e-commerce companies.",
      ],
    },
    {
      anchor: "barrett-sleeman",
      slug: "barrett-e-g-sleeman",
      name: "Barrett E.G. Sleeman, P.Eng.",
      role: "Director",
      image: "/lsh/barrett-sleeman.jpg",
      bio: [
        "Barrett Sleeman is a Professional Engineer with a varied career history in resource development and finance. He has supervised a $5 billion loan portfolio for the Royal Bank of Canada, served as a financial analyst for a national brokerage house, and has been an officer and director of numerous public companies. He is a retired emergency medical technician and first responder and is a director of THEMAC Resources Group.",
      ],
    },
    {
      anchor: "david-vogt",
      slug: "david-vogt",
      name: "Dr. David Vogt",
      role: "Director",
      image: "/lsh/david-vogt.jpg",
      bio: [
        "Dr. David Vogt is a scientist and innovation leader based in Vancouver, Canada. He holds an Interdisciplinary Ph.D. (SFU 1990), a B.A. in English Literature (UBC 1978) and a Hons. B.Sc. in Astrophysics (UBC 1977).",
        "Dr. Vogt has launched ten information technology companies and is currently CEO of two of these. He has also founded and led collaborative innovation organizations employing Vancouver as a “living lab” for pioneering mobile media and urban data solutions.",
        "Dr. Vogt has a breadth of academic, government, corporate, non-profit and startup experience, including advisory and governance roles, and continues to teach graduate courses at the University of British Columbia.",
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
