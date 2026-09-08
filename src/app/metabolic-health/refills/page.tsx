import type { Metadata } from "next";

import { RefillsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Refills",
  description:
    "Starter items are not refills. What refill service exists today for metabolic-health supplies, and what does not.",
};

export default function Page() {
  return <RefillsPage />;
}
