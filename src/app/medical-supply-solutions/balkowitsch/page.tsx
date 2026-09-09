import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Balkowitsch Worldwide",
  description:
    "Balkowitsch Worldwide, the U.S. online store priced in U.S. dollars, in the LifeSupply Health group.",
  path: "/medical-supply-solutions/balkowitsch/",
});

export default function Page() {
  return <StoreBrandPage brandKey="balkowitsch" />;
}
