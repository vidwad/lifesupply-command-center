import type { Metadata } from "next";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "LifeSupply",
  description:
    "LifeSupply.ca, the Canadian medical and home-care supply store, in the LifeSupply Health group.",
};

export default function Page() {
  return <StoreBrandPage brandKey="lifesupply" />;
}
