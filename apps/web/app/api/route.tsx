import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  return NextResponse.json({ message: `Hello world!`, req: request.nextUrl.searchParams.getAll("halo") });
  // return NextResponse.redirect("https://google.com")
}