import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { InvestorRelationsPage } from "@/components/public-site/lifesupply-pages";
import { fetchPublishedDocuments } from "@/lib/public-site/published";

export const metadata: Metadata = publicMetadata({
  title: "Investors",
  description:
    "LifeSupply Health investor information: the operating business, the reported 2025 figures with their basis, the growth priorities and phased approach, longer-term opportunities under evaluation, investor materials, and disclosures.",
  path: "/investor-relations/",
});

// The materials section lists governed published documents from the
// Command Center's published-only endpoint, as Company News did until
// 2026-09-13. Segment config must be a literal; keep in step with
// PUBLISHED_REVALIDATE_SECONDS (300).
export const revalidate = 300;

export default async function Page() {
  const documents = await fetchPublishedDocuments();
  return <InvestorRelationsPage documents={documents} />;
}
