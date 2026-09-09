import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "LifeSupply",
  description:
    "LifeSupply.ca, the Canadian medical and home-care supply store, in the LifeSupply Health group.",
  path: "/our-operations/lifesupply/",
});

export default function Page() {
  return <StoreBrandPage brandKey="lifesupply" />;
}
