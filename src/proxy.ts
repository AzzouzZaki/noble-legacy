import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdminRoot =
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname === "/admin/";

  // Unauthenticated: redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Authenticated: redirect away from login/root to products
  if (token && (isLoginPage || isAdminRoot)) {
    return NextResponse.redirect(new URL("/admin/products", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
