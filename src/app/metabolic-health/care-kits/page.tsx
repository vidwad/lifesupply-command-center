import type { Metadata } from "next";

import { CareKitsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Care kits",
  description: "Eight configurable supply pathways for metabolic-health programs, in development.",
};

export default function Page() {
  return <CareKitsPage />;
}
