import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Terms of use",
  description:
    "How the public LifeSupply Health website may be used; purchases are made on the operating stores under their own terms.",
  path: "/terms/",
});

export default function Page() {
  return <PolicyPage policy="terms" />;
}
