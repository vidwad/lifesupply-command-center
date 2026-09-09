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
      "Current company news is published here with its date. Investor documents are listed by access class, with public documents published through the governed workflow. The historical releases keep their original dates and public sources. Practical resources appear once they carry a named author, reviewer, and review date.",
  },
  sections: {
    current: {
      title: "Company news",
      empty: "No company news has been published on this site.",
      unavailable:
        "Company news is temporarily unavailable. The historical record below is unaffected.",
    },
    historical: {
      title: "Historical releases",
      note: "Dated releases from 2022, linking to their public sources.",
    },
    resources: {
      title: "Resources",
      empty:
        "No resources have been published yet. Each will carry its author, reviewer, and review date.",
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
    intro:
      "This index lists investor materials by access class. No document file is hosted on this site yet; public documents will be published here with their version and date, and restricted materials remain available on request through the investor-relations channel.",
    classes: [
      {
        title: "Public",
        text: "Published here once approved, with title, date, version, and effective date.",
      },
      {
        title: "Restricted, on request",
        text: "Shared with suitable recipients after a request and any confidentiality terms; never at a public address.",
      },
      {
        title: "Historical",
        text: "Earlier materials kept for the record and labelled by their original date.",
      },
    ],
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
      empty:
        "No public document has been published yet. Approved public documents appear here with their date and version.",
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
