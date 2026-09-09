import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnerSuppliersPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Partners: Suppliers and manufacturers",
  description:
    "Categories, regions, product data, and the onboarding process for supplying the operating stores.",
  path: "/partners/suppliers/",
});

export default function Page() {
  return <PartnerSuppliersPage />;
}
