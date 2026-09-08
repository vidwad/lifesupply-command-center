import type { Metadata } from "next";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the public LifeSupply Health website collects, and what it does not.",
};

export default function Page() {
  return <PolicyPage policy="privacy" />;
}
