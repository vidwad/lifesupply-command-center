import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { EquipmentPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Clinic equipment",
  description: "Room-by-room clinic equipment planning and quotes.",
  path: "/clinic-solutions/equipment/",
});

export default function Page() {
  return <EquipmentPage />;
}
