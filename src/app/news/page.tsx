import type { Metadata } from "next";
import { NewsPage } from "@/components/public-site/lifesupply-pages";
export const metadata: Metadata = {
  title: "News",
  description: "Historical LifeSupply Health company news and announcements.",
};
export default function Page() {
  return <NewsPage />;
}
