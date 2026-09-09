import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnerAcquisitionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Partners: Acquisitions and strategic transactions",
  description:
    "Fit criteria, general structures, and a confidential process. No transaction is announced or implied.",
  path: "/partners/acquisitions/",
});

export default function Page() {
  return <PartnerAcquisitionsPage />;
}
