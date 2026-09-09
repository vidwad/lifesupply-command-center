import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { ClinicsBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "LifeSupply Clinics",
  description:
    "Clinic planning, design, construction and fit-out, and equipment services in British Columbia.",
  path: "/our-operations/lifesupply-clinics/",
});

export default function Page() {
  return <ClinicsBrandPage />;
}
