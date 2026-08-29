import { prisma } from "@/lib/prisma";
import { snowflakeSchema } from "@shared/zod/discordSchemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs">,
) {
  const { id: shiftIdParam } = await params;

  const shiftId = Number(shiftIdParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  const employeeDiscordIdUnparsed =
    req.nextUrl.searchParams.get("employeeDiscordId");
  const employeeDiscordIdParsed = snowflakeSchema.safeParse(
    employeeDiscordIdUnparsed,
  );

  if (!employeeDiscordIdParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameter 'employeeDiscordId'" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.shiftEmployeeLog.findFirst({
      where: {
        employee: {
          discordId: employeeDiscordIdParsed.data,
        },
        shiftId,
      },
      include: {
        employee: { select: { discordId: true } },
        shift: { select: { shiftNumber: true } },
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
