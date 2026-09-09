import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnerPharmaciesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Partners: Pharmacies",
  description:
    "Non-drug supply programs with pharmacist-selected configurations and stated fulfilment responsibilities; in development.",
  path: "/partners/pharmacies/",
});

export default function Page() {
  return <PartnerPharmaciesPage />;
}
