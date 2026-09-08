/**
 * Newsroom for Stage 5 (WB-506): three families kept apart.
 *
 * - `historical`: the four 2022 releases approved as already published,
 *   linking to their public sources with their original dates.
 * - `current`: company news published on this site. None exists; the array
 *   is empty rather than filled, and the page says so.
 * - `resources`: practical guidance with a named author, reviewer, and
 *   dates. None has been approved, so none is listed. The six briefs the
 *   guide suggests are recorded in STAGE_05_EVIDENCE.md as candidates, not
 *   as content.
 *
 * `NewsItem` and `Resource` are the templates the `/news/[slug]/` and
 * `/resources/[slug]/` routes render once a record is approved (Stage 6
 * moves them to the published DTO). No date, author, or reviewer is
 * fabricated to fill a layout.
 */

export interface HistoricalRelease {
  date: string;
  title: string;
  source: string;
  href: string;
}

export interface NewsItem {
  slug: string;
  title: string;
  /** Original publication date, preserved. */
  date: string;
  summary: string;
  body: readonly string[];
  source: { label: string; href: string } | null;
  related: readonly { label: string; route: string }[];
}

export interface Resource {
  slug: string;
  title: string;
  summary: string;
  body: readonly string[];
  author: string;
  reviewer: string;
  published: string;
  reviewed: string;
  /** Action-registry key. */
  action: string;
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
    },
    historical: {
      title: "Historical releases",
      note: "Dated releases from 2022, linking to their public sources.",
    },
    resources: {
      title: "Resources",
      empty:
        "No resources have been published yet. Each will carry its author, reviewer, and review date.",
    },
  },
  current: [] as readonly NewsItem[],
  resources: [] as readonly Resource[],
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

export function getNewsItem(slug: string): NewsItem | null {
  return news.current.find((item) => item.slug === slug) ?? null;
}

export function getResource(slug: string): Resource | null {
  return news.resources.find((item) => item.slug === slug) ?? null;
}
