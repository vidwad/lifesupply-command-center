/**
 * Team copy, reconciled in Stage 5 (WB-505).
 *
 * WEB-06 (current roster and approved biographies) arrived unfilled, so the
 * safer public label is the dated title from each person's legacy profile
 * (S-101), stated as such. The card titles that differed from those profiles
 * are no longer shown. John Anderson exists only as a legacy profile (S-102);
 * his profile page is retained at its original slug and he is not listed on
 * the board until confirmed. One portrait is held (S-104); other cards use
 * initials. Biographies remain the preserved public profiles.
 */
export const team = {
  hero: {
    eyebrow: "Our team",
    title: "Leadership across operations, finance, business development, and technology.",
    description:
      "Titles and biographies are as published on the prior LifeSupply website, with their profiles preserved at their original addresses. Current appointments are confirmed through the company before this page is updated.",
  },
  labels: {
    management: "Management",
    board: "Board of directors",
    titlesNote: "Titles as published on the prior LifeSupply website.",
  },
  management: [
    {
      name: "Abdul Ladha",
      slug: "abdul-ladha",
      summary:
        "Electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience.",
      image: "/lsh/abdul-ladha.jpg",
    },
    {
      name: "Ben Hastibakhsh",
      slug: "ben-hastibakhsh",
      summary:
        "VP of Business Development and co-founder of Wellmart Health, with a public record in home medical equipment growth.",
    },
    {
      name: "Gary Li",
      slug: "gary-li",
      summary:
        "VP of Finance with more than 11 years of management experience across private and public companies.",
    },
    {
      name: "Craig Loverock",
      slug: "craig-loverock",
      summary:
        "Financial executive with more than 25 years in accounting and finance roles in North America and the United Kingdom.",
    },
    {
      name: "Mike Gill",
      slug: "mike-gill",
      summary:
        "Retail operations leader with experience across national retailers and flagship store launches.",
    },
    {
      name: "Chris Ishola",
      slug: "christopher-ishola",
      summary:
        "Chartered Professional Accountant with more than 30 years of experience across manufacturing and healthcare sectors.",
    },
    {
      name: "Ross Jelveh",
      slug: "ross-jelveh-2",
      summary:
        "Technology and business leader with experience in enterprise-level application integration and ecommerce optimization.",
    },
  ],
  /** The approved board list (S-100), each linked to the preserved profile. */
  board: [
    { name: "Abdul Ladha", slug: "abdul-ladha" },
    { name: "Keith Dolo", slug: "keith-dolo-2" },
    { name: "Barrett Sleeman", slug: "barrett-e-g-sleeman" },
    { name: "Dr. David Vogt", slug: "david-vogt" },
    { name: "Dr. Margaret Clarke", slug: "dr-margaret-clarke-2" },
    { name: "Dr. Dedeshya Holowenko", slug: "dr-dedeshya-holowenko" },
  ],
  legacyProfiles: [
    {
      slug: "abdul-ladha",
      name: "Abdul Ladha",
      role: "Chairman & CEO",
      bio: "Abdul Ladha is an electrical engineer, entrepreneur, business leader, and philanthropist with 30 years of business and capital-market experience. His legacy profile notes that he was Chairman and CEO of Ableauctions.com Inc., founded the Spark Global Philanthropic Foundation, and periodically instructed at the Sauder School of Business, University of British Columbia.",
    },
    {
      slug: "ben-hastibakhsh",
      name: "Ben Hastibakhsh",
      role: "VP of Business Development / Co-Founder, Wellmart",
      bio: "The legacy profile identifies Ben Hastibakhsh as VP of Business Development and co-founder of Wellmart Health Supplies Ltd., a division of LifeSupply Health. It cites more than 20 years of business-development, marketing, and public-relations experience.",
    },
    {
      slug: "gary-li",
      name: "Gary Li",
      role: "VP of Finance",
      bio: "The legacy profile identifies Gary Li as a CPA, CA with more than 11 years of accounting and finance experience. It notes prior roles in senior finance management and business-transformation and acquisition projects.",
    },
    {
      slug: "craig-loverock",
      name: "Craig Loverock",
      role: "Chief Financial Officer",
      bio: "The legacy profile identifies Craig Loverock as a CPA, CA with more than 25 years of accounting and finance experience in Canada, the United States, and England. It references prior public-company finance and audit-committee roles.",
    },
    {
      slug: "mike-gill",
      name: "Mike Gill",
      role: "Manager, Warehouse Dropship Centre",
      bio: "The legacy profile describes Mike Gill as having 20 years of retail-management and operations experience, including flagship retail-store launches and work with national retailers.",
    },
    {
      slug: "christopher-ishola",
      name: "Christopher Ishola",
      role: "Systems & Operations",
      bio: "The legacy profile identifies Christopher Ishola as a Chartered Professional Accountant with more than 30 years of experience spanning manufacturing and healthcare. It references accounting, audit, review, tax, and private- and public-company advisory work.",
    },
    {
      slug: "ross-jelveh-2",
      name: "Ross Jelveh",
      role: "VP Technology",
      bio: "The legacy profile describes Ross Jelveh as a technologist and certified software engineer with 20 years of technology and business experience. It references enterprise application integration and ecommerce optimization work.",
    },
    {
      slug: "keith-dolo-2",
      name: "Keith Dolo",
      role: "Director",
      bio: "The legacy profile states that Keith Dolo holds an honours commerce degree and has a track record in finance and accounting, including prior leadership with Robert Half International and entrepreneurial experience in high-growth ecommerce brands.",
    },
    {
      slug: "barrett-e-g-sleeman",
      name: "Barrett E. G. Sleeman",
      role: "Director",
      bio: "The legacy profile identifies Barrett Sleeman as a Professional Engineer with a career in resource development and finance, including public-company officer and director roles and prior emergency medical technician and first-responder experience.",
    },
    {
      slug: "david-vogt",
      name: "Dr. David Vogt",
      role: "Director",
      bio: "The legacy profile describes Dr. David Vogt as a Vancouver-based scientist and innovation leader with interdisciplinary doctoral training, company-launch experience, governance roles, and graduate teaching work at the University of British Columbia.",
    },
    {
      slug: "dr-margaret-clarke-2",
      name: "Dr. Margaret Clarke",
      role: "Director",
      bio: "The legacy profile describes Dr. Margaret Clarke as a developmental pediatrician with honours recognized by the Alberta Medical Association and experience in child health, remote care settings, Indigenous communities, and women’s shelters.",
    },
    {
      slug: "dr-dedeshya-holowenko",
      name: "Dr. Dedeshya Holowenko",
      role: "Director",
      bio: "The legacy profile describes Dr. Dedeshya Holowenko as a physician with certification in family medicine, emergency medicine, and women’s health. It references teaching, physician-program governance, and advisory work related to women’s pharmaceutical treatments.",
    },
    {
      slug: "john-anderson-2",
      name: "John Anderson",
      role: "Director",
      bio: "The legacy profile identifies John Anderson as a mergers-and-acquisitions attorney and partner with Stikeman Elliott, with more than 30 years of experience on major Canadian transactions.",
    },
  ],
  profileNote:
    "This preserved biography and title are from the prior public website. Current roles are confirmed through the company before a profile is updated.",
} as const;

/** The dated legacy title for a slug; every card and board entry resolves through here. */
export function legacyTitle(slug: string): string {
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) throw new Error(`No legacy profile for ${slug}`);
  return profile.role;
}
