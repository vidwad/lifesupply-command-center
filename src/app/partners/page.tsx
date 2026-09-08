import type { Metadata } from "next";

import { PartnersPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Clinics, pharmacies, suppliers and manufacturers, and acquisition or strategic counterparties: four relationships, each on its own terms.",
};

export default function Page() {
  return <PartnersPage />;
}
