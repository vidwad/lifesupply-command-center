import type { Metadata } from "next";

import { InvestorDocumentsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Investor documents",
  description:
    "Investor materials by access class: public, restricted on request, and historical. No file is hosted on this site yet.",
};

export default function Page() {
  return <InvestorDocumentsPage />;
}
