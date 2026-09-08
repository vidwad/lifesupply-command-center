/**
 * Newsroom copy (Stage 5, updated in Stage 6).
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

export interface HistoricalRelease {
  date: string;
  title: string;
  source: string;
  href: string;
}

export const news = {
  hero: {
    eyebrow: "News & resources",
    title: "Company news, the historical record, and practical resources.",
    description:
      "Current company news is published here with its date. The historical releases below keep their original dates and public sources. Practical resources appear once they carry a named author, reviewer, and review date.",
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
