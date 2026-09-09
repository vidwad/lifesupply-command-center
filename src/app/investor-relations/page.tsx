import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { InvestorRelationsPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = publicMetadata({
  title: "Investor relations",
  description: "LifeSupply Health investor information with disclosure context.",
  path: "/investor-relations/",
});
export default function Page() {
  return <InvestorRelationsPage />;
}
