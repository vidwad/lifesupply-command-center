import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { TeamPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = publicMetadata({
  title: "Our team",
  description: "LifeSupply Health leadership and board overview.",
  path: "/our-team/",
});
export default function Page() {
  return <TeamPage />;
}
