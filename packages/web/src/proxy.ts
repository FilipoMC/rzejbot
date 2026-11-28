import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

const PUBLIC_API_PATHS = ["/api/shifts/006", "/api/site", "/api/auth"];

export const proxy = auth((request) => {
  const pathname = request.nextUrl.pathname;

  if (
    PUBLIC_API_PATHS.some((public_path) => pathname.startsWith(public_path))
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (authHeader !== `Bearer ${process.env.API_TOKEN}`) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }
  } else {
    if (!request.auth && pathname !== "/login") {
      return Response.redirect(new URL("/login", request.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
