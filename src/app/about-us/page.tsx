import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { AboutPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = publicMetadata({
  title: "About us",
  description: "LifeSupply Health corporate profile and public operating vision.",
  path: "/about-us/",
});
export default function Page() {
  return <AboutPage />;
}
