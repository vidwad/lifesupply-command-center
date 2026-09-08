import type { Metadata } from "next";

import { AdvancedTherapeuticsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Advanced therapeutics",
  description:
    "Pharmacy, specialty and compounding, peptide synthesis and research, and manufacturing: four regulated themes, none operating, each with its dependencies.",
};

export default function Page() {
  return <AdvancedTherapeuticsPage />;
}
