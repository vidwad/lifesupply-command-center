import type { Metadata } from "next";

import { ShopBoundaryPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Product access",
  description: "LifeSupply Health commerce channel information.",
};

export default function Page() {
  return <ShopBoundaryPage />;
}
