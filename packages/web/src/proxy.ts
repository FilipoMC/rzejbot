import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    if (authHeader !== `Bearer ${process.env.API_TOKEN}`) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
