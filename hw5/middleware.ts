import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/post"]; // additional checks handled inline

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  if (!token) {
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) ||
      pathname === "/profile"
    ) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!token.handle && pathname !== "/onboarding" && !pathname.startsWith("/api/auth")) {
    const url = new URL("/onboarding", request.url);
    return NextResponse.redirect(url);
  }

  if (token.handle && pathname === "/login") {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
