import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PharmacySolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Pharmacy Solutions",
  description:
    "Proposed non-drug supply and fulfilment arrangements for pharmacies, in development: the pharmacy’s needs, representative supplies, the operating model, proposed ordering tools, and how to take part.",
  path: "/pharmacy-solutions/",
});

export default function Page() {
  return <PharmacySolutionsPage />;
}
