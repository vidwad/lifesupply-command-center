import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PartnerClinicsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Partners: Clinics",
  description: "Program and design collaboration with clinics, distinct from ordinary procurement.",
  path: "/partners/clinics/",
});

export default function Page() {
  return <PartnerClinicsPage />;
}
