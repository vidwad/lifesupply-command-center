/**
 * Newsroom copy (Stage 5, updated in Stage 6; investor documents merged in
 * on 2026-09-09).
 *
 * - `historical`: the four 2022 releases approved as already published,
 *   linking to their public sources with their original dates. Stable
 *   approved copy; stays static under the eligibility policy.
 * - Company news and resources are governed content since Stage 6: the
 *   public pages read them from the Command Center's published-only
 *   endpoints (`src/lib/public-site/published.ts`). Nothing about them is
 *   authored here. When the endpoint is unavailable the section says so
 *   rather than showing an empty list.
 */

export interface DocumentRecord {
  title: string;
  /** As stated on the material itself; never inferred. */
  date: string;
  category: "Public" | "Restricted, on request" | "Historical";
  version: string | null;
  /** Public documents carry a same-origin href once Stage 6 publishes them; none exists yet. */
  href: null;
  note: string;
}

export interface HistoricalRelease {
  date: string;
  title: string;
  source: string;
  href: string;
}

export const news = {
  hero: {
    eyebrow: "News & resources",
    title: "Company news, investor documents, the historical record, and practical resources.",
    description:
      "Company news carries its date. Investor documents are grouped by who can see them: some are open, some are shared on request. The 2022 releases are kept as a record and link to their original sources.",
  },
  /**
   * A corporate overview built entirely from facts already published
   * elsewhere on this site (round three, outcome 9). The news and resources
   * sections are legitimately empty; rather than leave a visitor with nothing
   * or invent an announcement to fill the gap, the page states what the group
   * is. Every figure here appears on the investor pages with its full scope.
   */
  overview: {
    eyebrow: "The company at a glance",
    title: "What LifeSupply is, in one place.",
    intro:
      "For anyone arriving here first: the group, its businesses, and the figures it has reported.",
    facts: [
      {
        label: "The group",
        text: "LifeSupply Health Inc. is a Canadian parent company with three wholly-owned subsidiaries: Wellmart Health Supplies Ltd. in Canada, LifeSupply US, Inc. in the United States, and Balkowitsch Enterprises Inc.",
      },
      {
        label: "What it sells",
        text: "Health, safety, medical and industrial products online, through LifeSupply.ca and Wellmart Medical in Canada and Balkowitsch Worldwide in the United States. LifeSupply Clinics is a project business, not a store.",
      },
      {
        label: "Where it operates",
        text: "Online commerce across Canada and the United States. Clinic planning, design, construction, fit-out and equipment for projects in British Columbia.",
      },
      {
        label: "Scale",
        text: "More than 25 years of operations, more than 50,000 products, and over 1,000,000 customers served since inception.",
      },
      {
        label: "Reported results",
        text: "For the year ended December 31, 2025: consolidated net sales of C$6.75M, gross profit of C$2.20M, and net income of C$284K, in Canadian dollars, unaudited.",
      },
      {
        label: "In development",
        text: "Metabolic-health supply and services, and non-drug supply programs for pharmacies. Neither is available today.",
      },
    ],
    action: "investor_materials",
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
      note: "Dated releases from 2022, linking to their public sources.",
    },
    resources: {
      title: "Resources",
      empty: "There are no resources here yet.",
      unavailable: "Resources are temporarily unavailable.",
    },
  },
  /**
   * The investor documents index, merged here from the former
   * `/investor-relations/documents/` page on 2026-09-09 (product owner).
   * Unchanged in substance: access classes, the dated records, the
   * governed published list, and the request step.
   */
  documents: {
    eyebrow: "Investor documents",
    title: "Investor documents: public, on request, and historical.",
    /**
     * Round four, change 9. Three access classes were published while nothing
     * was downloadable, so two-thirds of the block described categories a
     * visitor could not act on: "Public" held nothing, and the classification
     * scheme is document control rather than information a reader needs. The
     * page now names the materials that exist and the one action available,
     * which is to ask for them. The classes stay on each record as a label.
     */
    intro:
      "Three materials are held for investors. None is downloadable here: each is shared through investor relations, with the recipient and any confidentiality terms settled first.",
    records: [
      {
        title: "Annual-report narrative, year ended December 31, 2025",
        date: "Year ended December 31, 2025",
        category: "Restricted, on request",
        version: null,
        href: null,
        note: "Source of the unaudited consolidated figures shown on the investor pages.",
      },
      {
        title: "Financing presentation",
        date: "August 25, 2026",
        category: "Restricted, on request",
        version: null,
        href: null,
        note: "Outlines proposed expansion themes; subject to suitability, disclosure, board approval, regulatory requirements, and final terms.",
      },
      {
        title: "Investor presentation",
        date: "May 2022",
        category: "Historical",
        version: null,
        href: null,
        note: "Earlier corporate presentation from the prior website; available on request for the record.",
      },
    ] satisfies readonly DocumentRecord[],
    published: {
      title: "Published public documents",
      empty: "There is no public document here yet.",
      unavailable:
        "The published document list is temporarily unavailable. The records below are unaffected.",
      download: "Download",
    },
    requestNote:
      "Requests are answered by the investor-relations contact. Restricted materials are provided only to suitable recipients and are not distributed through this site.",
    actions: ["investor_materials"],
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
