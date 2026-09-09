import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { ShareholderServicesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Shareholder services",
  description: "Administrative requests from shareholders and how to make them.",
  path: "/investor-relations/shareholder-services/",
});

export default function Page() {
  return <ShareholderServicesPage />;
}
