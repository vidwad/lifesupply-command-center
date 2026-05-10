import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/permissions";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

type Props = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { redirectTo } = await searchParams;
  return <LoginForm redirectTo={redirectTo ?? "/dashboard"} />;
}
