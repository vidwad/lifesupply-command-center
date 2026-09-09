import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { RefillsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Refills",
  description:
    "Starter items are not refills. What refill service exists today for metabolic-health supplies, and what does not.",
  path: "/metabolic-health/refills/",
});

export default function Page() {
  return <RefillsPage />;
}
