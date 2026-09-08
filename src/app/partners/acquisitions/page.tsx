import type { Metadata } from "next";

import { PartnerAcquisitionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Partners: Acquisitions and strategic transactions",
  description:
    "Fit criteria, general structures, and a confidential process. No transaction is announced or implied.",
};

export default function Page() {
  return <PartnerAcquisitionsPage />;
}
