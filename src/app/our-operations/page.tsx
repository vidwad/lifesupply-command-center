import type { Metadata } from "next";
import { OperationsPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "Our operations",
  description: "LifeSupply Health public operating overview.",
};
export default function Page() {
  return <OperationsPage />;
}
