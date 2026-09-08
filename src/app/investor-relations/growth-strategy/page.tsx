import type { Metadata } from "next";

import { GrowthStrategyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Growth strategy",
  description:
    "Five strands of the public strategy, each with its own status, and the dated public record.",
};

export default function Page() {
  return <GrowthStrategyPage />;
}
