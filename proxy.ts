import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes list
  const protectedRoutes = ["/dashboard", "/bills", "/accounts", "/categories", "/settings", "/transactions"]
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  // If visiting /transactions, redirect directly to /bills
  if (pathname === "/transactions" || pathname.startsWith("/transactions/")) {
    return NextResponse.redirect(new URL("/bills", request.url))
  }

  // Security Headers: X-Frame-Options, Content-Type-Options, Referrer-Policy, Permissions-Policy
  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bills/:path*",
    "/accounts/:path*",
    "/categories/:path*",
    "/settings/:path*",
    "/transactions/:path*",
  ],
}
