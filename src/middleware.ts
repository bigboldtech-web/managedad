import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isDashboardPage =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/campaigns") ||
    nextUrl.pathname.startsWith("/google-ads") ||
    nextUrl.pathname.startsWith("/meta-ads") ||
    nextUrl.pathname.startsWith("/optimization") ||
    nextUrl.pathname.startsWith("/automations") ||
    nextUrl.pathname.startsWith("/analytics") ||
    nextUrl.pathname.startsWith("/creatives") ||
    nextUrl.pathname.startsWith("/chat") ||
    nextUrl.pathname.startsWith("/fraud") ||
    nextUrl.pathname.startsWith("/competitors") ||
    nextUrl.pathname.startsWith("/landing-pages") ||
    nextUrl.pathname.startsWith("/keywords") ||
    nextUrl.pathname.startsWith("/city-campaigns") ||
    nextUrl.pathname.startsWith("/billing") ||
    nextUrl.pathname.startsWith("/settings");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/campaigns/:path*",
    "/google-ads/:path*",
    "/meta-ads/:path*",
    "/optimization/:path*",
    "/automations/:path*",
    "/automations",
    "/analytics/:path*",
    "/creatives/:path*",
    "/creatives",
    "/chat",
    "/fraud",
    "/competitors",
    "/landing-pages",
    "/landing-pages/:path*",
    "/keywords",
    "/city-campaigns/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
