import type { Metadata } from "next";

import { ClinicSolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Clinic Solutions",
  description: "Plan or renovate a clinic, equip it, or keep an existing clinic supplied.",
};

export default function Page() {
  return <ClinicSolutionsPage />;
}
