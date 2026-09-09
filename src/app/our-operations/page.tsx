import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { OperationsPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = publicMetadata({
  title: "Our operations",
  description: "LifeSupply Health public operating overview.",
  path: "/our-operations/",
});
export default function Page() {
  return <OperationsPage />;
}
