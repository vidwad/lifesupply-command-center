import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { MetabolicHealthPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Metabolic Health",
  description:
    "Non-drug supplies, clinic procurement, kitting and fulfilment, and contracted workflow support for metabolic-health programs, in development.",
  path: "/metabolic-health/",
});

export default function Page() {
  return <MetabolicHealthPage />;
}
