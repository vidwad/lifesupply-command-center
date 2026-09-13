/**
 * Company News copy (Stage 5, updated in Stage 6; renamed from News &
 * resources on 2026-09-13 at the product owner's direction).
 *
 * - `historical`: the four 2022 releases approved as already published,
 *   linking to their public sources with their original dates, newest
 *   first. A historical archive: nothing is added to it to make the page
 *   look active, and the 2022 board appointment is a dated record, not a
 *   statement of current board membership.
 * - Company news and resources are governed content since Stage 6: the
 *   public pages read them from the Command Center's published-only
 *   endpoints (`src/lib/public-site/published.ts`). Nothing about them is
 *   authored here. When the endpoint is unavailable the section says so
 *   rather than showing an empty list.
 * - The investor documents directory sat here from 2026-09-09 to
 *   2026-09-13; it is the materials section of the investor page now
 *   (`content/investors.ts`), and `/investor-relations/documents` lands there.
 */

export interface HistoricalRelease {
  date: string;
  title: string;
  source: string;
  href: string;
}

export const news = {
  hero: {
    eyebrow: "Company News",
    title: "Company announcements and historical releases.",
    description:
      "Announcements carry their date and link to their source. The 2022 releases are kept as a historical archive; new announcements are added here when they are published.",
  },
  /**
   * Unpublished since 2026-09-13 (product owner): the "New here?" company
   * introduction came off the page, which is announcements and the archive.
   * Kept on the record; About carries the group and Investors the figures.
   */
  overview: {
    eyebrow: "New here?",
    title: "What LifeSupply is, in one place.",
    intro:
      "LifeSupply Health Inc. is a Canadian parent company with three wholly-owned subsidiaries, selling health, safety, medical and industrial products online in Canada and the United States. LifeSupply Clinics plans, builds and equips clinics in British Columbia. About sets out the group, its history and its footprint; Investor Relations carries the reported figures with their basis.",
    action: "about_group",
  },

  sections: {
    current: {
      title: "Company news",
      empty: "There is no company news on this site yet.",
      unavailable:
        "Company news is temporarily unavailable. The historical record below is unaffected.",
    },
    historical: {
      title: "Historical releases",
      note: "A historical archive: dated 2022 releases, newest first, linking to their public sources.",
    },
    resources: {
      title: "Resources",
      empty: "There are no resources here yet.",
      unavailable: "Resources are temporarily unavailable.",
    },
  },
  /** Where the investor materials went, for the one link this page keeps to them. */
  materials: {
    text: "Investor materials — the annual-report narrative, the financing presentation, and the historical investor presentation — are listed on the Investors page.",
    action: "investor_materials_section",
  },

  itemUnavailable: {
    eyebrow: "Temporarily unavailable",
    title: "This page cannot be shown right now.",
    text: "The published content service is not reachable. Please try again shortly; the rest of the site is unaffected.",
  },
  historical: [
    {
      date: "June 14, 2022",
      title: "LifeSupply joins forces with Mothers Choice Products",
      source: "Newswire",
      href: "https://www.newswire.ca/news-releases/lifesupply-joins-forces-with-mothers-choice-products-for-online-distribution-of-top-tier-maternal-health-products-808815327.html",
    },
    {
      date: "May 11, 2022",
      title: "LifeSupply expands distribution partnership with Ortho Active",
      source: "Newswire",
      href: "https://www.newswire.ca/news-releases/lifesupply-expands-distribution-partnership-with-ortho-active-864792320.html",
    },
    {
      date: "April 21, 2022",
      title: "LifeSupply appoints Dr. Margaret Clarke to its Board of Directors",
      source: "Yahoo Finance",
      href: "https://ca.finance.yahoo.com/news/lifesupply-appoints-dr-margaret-clarke-150000607.html",
    },
    {
      date: "April 5, 2022",
      title: "LifeSupply acquires Smart Move Medical assets",
      source: "Yahoo News",
      href: "https://www.yahoo.com/now/lifesupply-announces-acquisition-medical-supplies-150000544.html",
    },
  ] satisfies readonly HistoricalRelease[],
} as const;
