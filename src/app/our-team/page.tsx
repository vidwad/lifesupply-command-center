import type { Metadata } from "next";
import { TeamPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "Our team",
  description: "LifeSupply Health leadership and board overview.",
};
export default function Page() {
  return <TeamPage />;
}
