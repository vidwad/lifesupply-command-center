import type { Metadata } from "next";
import { ContactPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "Contact",
  description: "LifeSupply Health public corporate contact channels.",
};
export default function Page() {
  return <ContactPage />;
}
