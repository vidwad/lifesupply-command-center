import type { Metadata } from "next";
import { InvestorRelationsPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "Investor relations",
  description: "LifeSupply Health investor information with disclosure context.",
};
export default function Page() {
  return <InvestorRelationsPage />;
}
