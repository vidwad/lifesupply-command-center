import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LifeSupplyHome } from "@/components/public-site/lifesupply-pages";
import { isLifeSupplyPublicHost } from "@/lib/public-site/host";
import { getCurrentUser } from "@/server/permissions";

export default async function HomePage() {
  const requestHeaders = await headers();
  if (isLifeSupplyPublicHost(requestHeaders.get("host"))) {
    return <LifeSupplyHome />;
  }

  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
