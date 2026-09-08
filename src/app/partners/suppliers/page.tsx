import type { Metadata } from "next";

import { PartnerSuppliersPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Partners: Suppliers and manufacturers",
  description:
    "Categories, regions, product data, and the onboarding process for supplying the operating stores.",
};

export default function Page() {
  return <PartnerSuppliersPage />;
}
