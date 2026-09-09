/**
 * Team copy.
 *
 * Reconciled in Stage 5 (WB-505) to the dated legacy profiles, and reduced
 * on 2026-09-08 at the product owner's direction: everyone previously
 * listed other than Abdul Ladha is no longer involved, so the management
 * cards, the board list, and the eleven other preserved profiles were
 * withdrawn. Their addresses redirect to the team page (next.config.ts;
 * `withdrawnProfileSlugs` below keeps the list in one place for the
 * public-host allowlist). The dated 2022 announcements in the newsroom and
 * milestones are historical records and are unchanged.
 */
export const team = {
  hero: {
    eyebrow: "Our team",
    title: "Leadership of LifeSupply Health Supplies Inc.",
    description:
      "Current leadership as confirmed by the company. Titles are as published on the prior LifeSupply website; the profile is preserved at its original address.",
  },
  labels: {
    management: "Leadership",
    titlesNote: "Title as published on the prior LifeSupply website.",
  },
  management: [
    {
      name: "Abdul Ladha",
      slug: "abdul-ladha",
      summary:
        "Electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience.",
      image: "/lsh/abdul-ladha.jpg",
    },
  ],
  legacyProfiles: [
    {
      slug: "abdul-ladha",
      name: "Abdul Ladha",
      role: "Chairman & CEO",
      bio: "Abdul Ladha is an electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience. His legacy profile notes that he was Chairman and CEO of Ableauctions.com Inc., founded the Spark Global Philanthropic Foundation, and periodically instructed at the Sauder School of Business, University of British Columbia.",
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
    "keith-dolo-2",
    "barrett-e-g-sleeman",
    "david-vogt",
    "dr-margaret-clarke-2",
    "dr-dedeshya-holowenko",
    "john-anderson-2",
  ],
  profileNote:
    "This preserved biography and title are from the prior public website. Current roles are confirmed through the company before a profile is updated.",
} as const;

/** The dated legacy title for a slug; every card resolves through here. */
export function legacyTitle(slug: string): string {
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) throw new Error(`No legacy profile for ${slug}`);
  return profile.role;
}
