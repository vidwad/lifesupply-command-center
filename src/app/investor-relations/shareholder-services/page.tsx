import type { Metadata } from "next";

import { ShareholderServicesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Shareholder services",
  description: "Administrative requests from shareholders and how to make them.",
};

export default function Page() {
  return <ShareholderServicesPage />;
}
