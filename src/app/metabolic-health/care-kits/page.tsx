import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { CareKitsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Care kits",
  description: "Eight configurable supply pathways for metabolic-health programs, in development.",
  path: "/metabolic-health/care-kits/",
});

export default function Page() {
  return <CareKitsPage />;
}
