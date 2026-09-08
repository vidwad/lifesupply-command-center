import type { Metadata } from "next";

import { TechnologyFulfilmentPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Technology & fulfilment",
  description:
    "Sourcing, catalogue, orders, and fulfilment across the LifeSupply operating websites.",
};

export default function Page() {
  return <TechnologyFulfilmentPage />;
}
