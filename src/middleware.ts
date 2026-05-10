import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all routes except Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

export default middleware((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname, origin } = req.nextUrl;

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
