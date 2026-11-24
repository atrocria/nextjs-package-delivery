import { NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/utils/supabase/proxy";
import { hasSupabaseConfig } from "@/utils/supabase/config";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseConfig()) {
    return NextResponse.next();
  }

  // Public pages
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/verify",
  ];

  // Let visitors access public pages without authentication redirects.
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Keep Supabase session and authentication handling
  // for the remaining routes.
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
