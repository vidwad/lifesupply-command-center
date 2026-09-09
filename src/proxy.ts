import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { authConfig } from "@/server/auth/config";
import { isLifeSupplyPublicHost } from "@/lib/public-site/host";
import { isInternalPath, isPublicApiPath, isPublicPagePath } from "@/lib/public-site/public-paths";

const { auth } = NextAuth(authConfig);

export const config = {
  // Match all routes except Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

/**
 * Public host (Stage 9 scoped boundary fix, D-03 and D-12).
 *
 * Decided before the authentication wrapper runs, so the public host never
 * sets an Auth.js cookie and never answers with a redirect to `/login`:
 *   - public API and health: pass through;
 *   - a registered public page or retained profile: pass through;
 *   - an internal family (dashboard groups, auth, other APIs): home;
 *   - anything else: pass through to Next's 404, never a soft redirect.
 * The historical block list is kept explicit for readers and canaries;
 * `isInternalPath` covers every dashboard family beyond it.
 */
function publicHostResponse(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const isBlockedInternalPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/api/") ||
    isInternalPath(pathname);

  if (isBlockedInternalPath) {
    return NextResponse.redirect(new URL("/", origin));
  }

  if (isPublicPagePath(pathname)) {
    return NextResponse.next();
  }

  // Unknown path: let the not-found page answer with a real 404.
  return NextResponse.next();
}

const internalHost = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname, origin } = req.nextUrl;

  if (isPublicApiPath(pathname)) {
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

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const isPublicHost = isLifeSupplyPublicHost(req.headers.get("host"));
  if (isPublicHost) {
    return publicHostResponse(req);
  }
  // Auth.js types its middleware context narrowly; the runtime shape is the fetch event.
  return internalHost(req, event as unknown as Parameters<typeof internalHost>[1]);
}
