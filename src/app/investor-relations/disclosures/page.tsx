import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { DisclosuresPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Disclosures",
  description:
    "The reported figures with their period, basis, and entity scope, and the forward-looking basis of the rest.",
  path: "/investor-relations/disclosures/",
});

export default function Page() {
  return <DisclosuresPage />;
}
