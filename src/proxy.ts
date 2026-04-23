import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_PATHS,
  PROTECTED_PATHS,
  PUBLIC_PATHS,
} from "@/lib/auth/constants";
import { auth } from "@/lib/auth/server";
import {
  getUserRole,
  canAccessAdminDashboard,
  canAccessDriverApp,
} from "@/lib/auth/roles";

const PUBLIC_FILE = /\.(.*)$/;

const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
  pathname === "/favicon.ico" ||
  pathname === "/health" ||
  pathname === "/unauthorized";

const isAuthRoute = (pathname: string): boolean => pathname.startsWith("/auth");

const isProtectedRoute = (pathname: string): boolean =>
  PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const shouldSkipProxy = (pathname: string): boolean =>
  isPublicRoute(pathname) || PUBLIC_FILE.test(pathname);

export async function proxy(
  request: NextRequest,
): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;

  if (shouldSkipProxy(pathname)) {
    return undefined;
  }

  const sessionCookie = getSessionCookie(request);

  // Check authentication
  if (!sessionCookie && isProtectedRoute(pathname)) {
    const loginUrl = new URL(AUTH_PATHS.SIGN_IN, request.url);
    if (!loginUrl.searchParams.has("redirectTo")) {
      const redirectTo = `${pathname}${request.nextUrl.search}`;
      loginUrl.searchParams.set("redirectTo", redirectTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Skip role-based access control for API routes - they handle their own auth
  if (pathname.startsWith("/api/")) {
    return undefined;
  }

  // Role-based access control for authenticated users on page routes only
  if (sessionCookie) {
    // Only check session and role for routes that require specific permissions
    const needsRoleCheck =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/master") ||
      pathname.startsWith("/shipments") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/driver");

    if (needsRoleCheck) {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (session) {
          const userRole = getUserRole(session.user);

          // Admin dashboard routes
          if (
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/master") ||
            pathname.startsWith("/shipments") ||
            pathname.startsWith("/reports")
          ) {
            if (!canAccessAdminDashboard(userRole)) {
              return NextResponse.redirect(
                new URL("/unauthorized", request.url),
              );
            }
          }

          // Driver app routes
          if (pathname.startsWith("/driver")) {
            if (!canAccessDriverApp(userRole)) {
              return NextResponse.redirect(
                new URL("/unauthorized", request.url),
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // Continue without role check if there's an error
      }
    }
  }

  return undefined;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
