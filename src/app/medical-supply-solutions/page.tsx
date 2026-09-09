import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { MedicalSupplySolutionsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Medical Supply Solutions",
  description:
    "LifeSupply, Wellmart Medical, and Balkowitsch Worldwide: three online stores for medical, health, and home-care supply.",
  path: "/medical-supply-solutions/",
});

export default function Page() {
  return <MedicalSupplySolutionsPage />;
}
