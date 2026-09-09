import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { ClinicSolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Clinic Solutions",
  description:
    "LifeSupply Clinics: plan or renovate a clinic, equip it, or keep an existing clinic supplied.",
  path: "/clinic-solutions/",
});

export default function Page() {
  return <ClinicSolutionsPage />;
}
