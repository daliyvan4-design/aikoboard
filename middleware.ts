import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n-routing";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authPages = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  if (authPages.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "aiko-dev-secret-change-in-prod" });
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|assets|uploads|.*\\..*).*)"],
};
