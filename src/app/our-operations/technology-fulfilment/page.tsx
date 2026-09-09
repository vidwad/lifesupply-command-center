import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { TechnologyFulfilmentPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Technology & fulfilment",
  description:
    "Sourcing, catalogue, orders, and fulfilment across the LifeSupply operating websites.",
  path: "/our-operations/technology-fulfilment/",
});

export default function Page() {
  return <TechnologyFulfilmentPage />;
}
