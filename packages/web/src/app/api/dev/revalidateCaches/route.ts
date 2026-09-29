import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidateTag("all", { expire: 0 });

  return NextResponse.json({ ok: true, data: null });
}
