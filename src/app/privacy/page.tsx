import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Privacy",
  description: "What the public LifeSupply Health website collects, and what it does not.",
  path: "/privacy/",
});

export default function Page() {
  return <PolicyPage policy="privacy" />;
}
