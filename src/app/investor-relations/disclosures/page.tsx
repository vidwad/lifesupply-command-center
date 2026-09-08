import type { Metadata } from "next";

import { DisclosuresPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Disclosures",
  description:
    "The reported figures with their period, basis, and entity scope, and the forward-looking basis of the rest.",
};

export default function Page() {
  return <DisclosuresPage />;
}
