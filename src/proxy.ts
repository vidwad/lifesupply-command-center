import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/server/auth/config";
import { isLifeSupplyPublicHost } from "@/lib/public-site/host";

const { auth } = NextAuth(authConfig);

export const config = {
  // Match all routes except Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname, origin } = req.nextUrl;
  const isPublicHost = isLifeSupplyPublicHost(req.headers.get("host"));
  const isAllowedPublicApi = pathname === "/api/health" || pathname.startsWith("/api/public/");

  if (isAllowedPublicApi) {
    return NextResponse.next();
  }

  if (isPublicHost) {
    const isBlockedInternalPath =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/");

    if (isBlockedInternalPath) {
      return NextResponse.redirect(new URL("/", origin));
    }
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");

  if (!isLoggedIn && !isAuthRoute && pathname !== "/") {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirectTo", pathname);
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL("/dashboard", origin));
  }
});
