import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Wellmart Medical",
  description:
    "Wellmart Medical, the Canadian home medical equipment and supplies store, in the LifeSupply Health group.",
  path: "/medical-supply-solutions/wellmart-medical/",
});

export default function Page() {
  return <StoreBrandPage brandKey="wellmart" />;
}
