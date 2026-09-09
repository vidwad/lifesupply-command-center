import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LifeSupplyHome } from "@/components/public-site/lifesupply-pages";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { isLifeSupplyPublicHost } from "@/lib/public-site/host";
import { organizationJsonLd, publicMetadata, webSiteJsonLd } from "@/lib/public-site/seo";
import { getCurrentUser } from "@/server/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (!isLifeSupplyPublicHost(requestHeaders.get("host"))) return {};
  return publicMetadata({
    title: "LifeSupply Health",
    description: LIFE_SUPPLY_CONTENT.homepage.description,
    path: "/",
  });
}

export default async function HomePage() {
  const requestHeaders = await headers();
  if (isLifeSupplyPublicHost(requestHeaders.get("host"))) {
    // Structured data (Stage 9): only facts the site already publishes; see seo.ts.
    const jsonLd = JSON.stringify([organizationJsonLd(), webSiteJsonLd()]);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <LifeSupplyHome />
      </>
    );
  }

  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
