import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/post"]; // additional checks handled inline

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to login and static files
  if (!token) {
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) ||
      pathname === "/profile" ||
      pathname === "/"
    ) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // User is authenticated
  const isOnboardingRoute = pathname === "/onboarding" || pathname === "/register";
  const isAuthRoute = pathname.startsWith("/api/auth");
  
  // If user doesn't have a handle yet, force them to register
  if (!token.handle && !isOnboardingRoute && !isAuthRoute) {
    const url = new URL("/register", request.url);
    return NextResponse.redirect(url);
  }

  // If user has handle and tries to access login/register, redirect to home
  if (token.handle && (pathname === "/login" || isOnboardingRoute)) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
