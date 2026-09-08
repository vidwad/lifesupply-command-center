import type { Metadata } from "next";

import { PartnerPharmaciesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Partners: Pharmacies",
  description:
    "Non-drug supply programs with pharmacist-selected configurations and stated fulfilment responsibilities; in development.",
};

export default function Page() {
  return <PartnerPharmaciesPage />;
}
