import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    nextUrl.pathname.startsWith("/city-campaigns") ||
    nextUrl.pathname.startsWith("/analytics") ||
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
    "/city-campaigns/:path*",
    "/analytics/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
