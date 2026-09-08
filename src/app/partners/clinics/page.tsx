import type { Metadata } from "next";

import { PartnerClinicsPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Partners: Clinics",
  description: "Program and design collaboration with clinics, distinct from ordinary procurement.",
};

export default function Page() {
  return <PartnerClinicsPage />;
}
