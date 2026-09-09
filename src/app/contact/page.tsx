import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";
import { ContactPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = publicMetadata({
  title: "Contact",
  description: "LifeSupply Health public corporate contact channels.",
  path: "/contact/",
});
export default function Page() {
  return <ContactPage />;
}
