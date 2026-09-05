import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes list
  const protectedRoutes = [
    "/dashboard",
    "/bills",
    "/accounts",
    "/budget-planner",
    "/categories",
    "/settings",
    "/transactions",
    "/preview",
  ]
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  // If visiting /transactions, redirect directly to /bills
  if (pathname === "/transactions" || pathname.startsWith("/transactions/")) {
    return NextResponse.redirect(new URL("/bills", request.url))
  }

  // Authentication check: verify session cookie or Supabase auth token
  const sessionCookie = request.cookies.get("spendly_session")?.value
  const hasSupabaseCookie = Array.from(request.cookies.getAll()).some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value.trim() !== ""
  )
  const isAuthenticated = Boolean((sessionCookie && sessionCookie.trim() !== "") || hasSupabaseCookie)

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
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
    "/budget-planner/:path*",
    "/categories/:path*",
    "/settings/:path*",
    "/transactions/:path*",
    "/preview/:path*",
  ],
}

