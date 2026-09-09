import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { ShopServicesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Shop & Services",
  description:
    "Choose the right LifeSupply store or service: geography, currency, destination, and support.",
  path: "/shop/",
});

export default function Page() {
  return <ShopServicesPage />;
}
