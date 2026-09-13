import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnerAcquisitionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Acquisitions & Strategic Opportunities",
  description:
    "Businesses and capabilities that could complement LifeSupply's supply operations, what a fit looks like, the structures that could be considered, and a confidential process. No transaction is announced or implied.",
  path: "/partners/acquisitions/",
});

export default function Page() {
  return <PartnerAcquisitionsPage />;
}
