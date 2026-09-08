import type { Metadata } from "next";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Wellmart Medical",
  description: "Wellmart Medical, the Canadian home medical equipment and supply store.",
};

export default function Page() {
  return <StoreBrandPage brandKey="wellmart" />;
}
