import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { DesignBuildPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Design & build",
  description: "Clinic design and construction in British Columbia, with delivery roles stated.",
  path: "/clinic-solutions/design-build/",
});

export default function Page() {
  return <DesignBuildPage />;
}
