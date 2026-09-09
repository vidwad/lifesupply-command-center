import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PharmacySolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Pharmacy Solutions",
  description:
    "Non-drug supply programs for pharmacies in development, and the stated direction for pharmacy-related operations, with their status.",
  path: "/pharmacy-solutions/",
});

export default function Page() {
  return <PharmacySolutionsPage />;
}
