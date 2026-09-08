import type { Metadata } from "next";
import { AboutPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "About us",
  description: "LifeSupply Health corporate profile and public operating vision.",
};
export default function Page() {
  return <AboutPage />;
}
