import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { GrowthStrategyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Growth strategy",
  description:
    "Five strands of the public strategy, each with its own status, and the dated public record.",
  path: "/investor-relations/growth-strategy/",
});

export default function Page() {
  return <GrowthStrategyPage />;
}
