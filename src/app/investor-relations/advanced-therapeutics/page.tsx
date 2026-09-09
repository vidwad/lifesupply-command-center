import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { AdvancedTherapeuticsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Advanced therapeutics",
  description:
    "Pharmacy, specialty and compounding, peptide synthesis and research, and manufacturing: four regulated options under evaluation, none operating, each with its dependencies.",
  path: "/investor-relations/advanced-therapeutics/",
});

export default function Page() {
  return <AdvancedTherapeuticsPage />;
}
