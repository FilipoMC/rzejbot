import { generateAccessKey } from "@/lib/accessKeys";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/report/reset-token">,
) {
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  try {
    const { rawKey, hashedKey } = generateAccessKey();

    const res = await prisma.shiftReport.update({
      where: {
        shiftId,
      },
      data: {
        accessTokenHash: hashedKey,
      },
      include: {
        cohost: { select: { discordId: true } },
        shift: { select: { shiftNumber: true } },
      },
      omit: {
        accessTokenHash: true,
      },
    });

    revalidateTag(`shiftReport:number:${res.shift.shiftNumber}`, { expire: 0 });

    return NextResponse.json(
      {
        ok: true,
        data: { ...res, accessToken: rawKey },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { ok: false, error: "Invalid shift" },
          { status: 404 },
        );
      }
    }

    console.error(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Error accessing the database or generating the access key",
      },
      { status: 500 },
    );
  }
}
