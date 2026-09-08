import type { Metadata } from "next";

import { DesignBuildPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Design & build",
  description: "Clinic design and construction in British Columbia, with delivery roles stated.",
};

export default function Page() {
  return <DesignBuildPage />;
}
