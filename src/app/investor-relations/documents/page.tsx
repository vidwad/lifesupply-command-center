import type { Metadata } from "next";

import { InvestorDocumentsPage } from "@/components/public-site/lifesupply-pages";
import { fetchPublishedDocuments } from "@/lib/public-site/published";

export const metadata: Metadata = {
  title: "Investor documents",
  description:
    "Investor materials by access class: public, restricted on request, and historical. Public documents are published through the governed workflow.",
};

// Segment config must be a literal; keep in step with PUBLISHED_REVALIDATE_SECONDS (300).
export const revalidate = 300;

export default async function Page() {
  const published = await fetchPublishedDocuments();
  return <InvestorDocumentsPage published={published} />;
}
