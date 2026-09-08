import type { Metadata } from "next";

import { ShopServicesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Shop & Services",
  description:
    "Choose the right LifeSupply store or service: geography, currency, destination, and support.",
};

export default function Page() {
  return <ShopServicesPage />;
}
