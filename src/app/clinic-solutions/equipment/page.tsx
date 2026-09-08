import type { Metadata } from "next";

import { EquipmentPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Clinic equipment",
  description: "Room-by-room clinic equipment planning and quotes.",
};

export default function Page() {
  return <EquipmentPage />;
}
