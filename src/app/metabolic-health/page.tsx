import type { Metadata } from "next";

import { MetabolicHealthPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Metabolic Health",
  description:
    "Non-drug supplies, clinic procurement, kitting and fulfilment, and contracted workflow support for metabolic-health programs, in development.",
};

export default function Page() {
  return <MetabolicHealthPage />;
}
