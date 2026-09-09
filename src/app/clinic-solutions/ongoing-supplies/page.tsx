import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { OngoingSuppliesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Ongoing clinic supplies",
  description: "Routine procurement and repeat ordering for clinics that are already open.",
  path: "/clinic-solutions/ongoing-supplies/",
});

export default function Page() {
  return <OngoingSuppliesPage />;
}
