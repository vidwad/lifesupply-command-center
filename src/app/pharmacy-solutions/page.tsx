import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PharmacySolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Pharmacy Solutions",
  description:
    "Medical, health, and home-care products for pharmacies through LifeSupply’s operating stores; patient-supply programs and ordering tools in development; specialty pharmacy and compounding opportunities under evaluation.",
  path: "/pharmacy-solutions/",
});

export default function Page() {
  return <PharmacySolutionsPage />;
}
