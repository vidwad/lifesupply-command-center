import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/permissions";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
