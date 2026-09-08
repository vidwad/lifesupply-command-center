import type { Metadata } from "next";

import { ClinicsBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "LifeSupply Clinics",
  description:
    "Clinic planning, design, construction and fit-out, and equipment services in British Columbia.",
};

export default function Page() {
  return <ClinicsBrandPage />;
}
