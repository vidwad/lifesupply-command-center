import type { Metadata } from "next";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "What is in place for keyboard, screen-reader, and reduced-motion use, and how to ask for help.",
};

export default function Page() {
  return <PolicyPage policy="accessibility" />;
}
