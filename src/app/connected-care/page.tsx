import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { ConnectedCarePage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Connected Care Vision",
  description:
    "How LifeSupply’s medical-supply businesses could connect with qualified healthcare professionals, pharmacy services, and digital tools: a long-term development vision, with what operates today, what is in development, and what is under evaluation.",
  path: "/connected-care/",
});

export default function Page() {
  return <ConnectedCarePage />;
}
