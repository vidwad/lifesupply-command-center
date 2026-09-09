import type { Metadata } from "next";

import { publicMetadata } from "@/lib/public-site/seo";

import { PolicyPage } from "@/components/public-site/lifesupply-pages";

export const metadata: Metadata = publicMetadata({
  title: "Accessibility",
  description:
    "What is in place for keyboard, screen-reader, and reduced-motion use, and how to ask for help.",
  path: "/accessibility/",
});

export default function Page() {
  return <PolicyPage policy="accessibility" />;
}
