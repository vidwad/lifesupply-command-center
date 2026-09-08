import type { Metadata } from "next";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "How the public LifeSupply Health website may be used; purchases are made on the operating stores under their own terms.",
};

export default function Page() {
  return <PolicyPage policy="terms" />;
}
