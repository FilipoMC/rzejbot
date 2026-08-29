import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await prisma.shift.findFirst({
      where: {
        report: {
          duration: null,
        },
      },
      include: {
        host: { select: { discordId: true } },
      },
      orderBy: {
        report: {
          date: "desc",
        },
      },
    });

    if (!res) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: res,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error accessing the database" },
      { status: 500 },
    );
  }
}
