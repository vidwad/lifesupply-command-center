import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnersPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Partners",
  description:
    "Clinics, pharmacies, suppliers and manufacturers, and acquisition or strategic counterparties: four relationships, each on its own terms.",
  path: "/partners/",
});

export default function Page() {
  return <PartnersPage />;
}
