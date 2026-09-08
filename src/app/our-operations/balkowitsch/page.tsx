import type { Metadata } from "next";

import { StoreBrandPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Balkowitsch Worldwide",
  description: "Balkowitsch Worldwide, the U.S. online store priced in U.S. dollars.",
};

export default function Page() {
  return <StoreBrandPage brandKey="balkowitsch" />;
}
