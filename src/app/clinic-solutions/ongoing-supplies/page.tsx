import type { Metadata } from "next";

import { OngoingSuppliesPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Ongoing clinic supplies",
  description: "Routine procurement and repeat ordering for clinics that are already open.",
};

export default function Page() {
  return <OngoingSuppliesPage />;
}
