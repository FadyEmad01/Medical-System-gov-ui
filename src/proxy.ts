import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { SESSION_COOKIE_NAME } from "./features/auth/lib/session-constants";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Routes that require an authenticated session. Matched against the path
 * *after* the locale prefix has been stripped.
 */
const PROTECTED_SEGMENTS = ["/dashboard", "/onboarding"];

/**
 * Auth-only routes (login, register, password reset). An authenticated user
 * hitting these is bounced to the dashboard to avoid a double-login state.
 */
const AUTH_SEGMENTS = ["/auth"];

export default function proxy(request: NextRequest) {
  // 1. Derive the locale-prefixed path so auth checks line up with routing.
  const { pathname } = request.nextUrl;
  const locale = extractLocale(pathname) ?? routing.defaultLocale;
  const pathWithoutLocale = stripLocale(pathname);

  // 2. Cookie presence is the only signal available to the proxy — it cannot
  //    verify the JWT without calling the backend, which middleware should not
  //    do. Stale/expired tokens are reconciled client-side by `meAction`.
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_SEGMENTS.some((p) =>
    pathWithoutLocale.startsWith(p),
  );
  const isAuthRoute = AUTH_SEGMENTS.some((p) =>
    pathWithoutLocale.startsWith(p),
  );

  if (isProtected && !hasSession) {
    const url = new URL(`/${locale}/auth/login`, request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // 3. Only now run next-intl (locale detection / rewriting). Skipping it on
  //    the early auth redirects keeps the hot path cheap.
  return intlMiddleware(request);
}

function extractLocale(pathname: string): string | undefined {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return undefined;
}

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

export const config = {
  // Skip static assets, API routes, and anything with a file extension.
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
