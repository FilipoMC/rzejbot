import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { differenceInMinutes } from "date-fns";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs/stations">,
) {
  const { id: shiftIdParam } = await params;

  const shiftId = Number(shiftIdParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  const dateNow = new Date();

  try {
    const employeeLogs = await prisma.shiftEmployeeLog.findMany({
      where: {
        shiftId,
        employee: {
          system: false,
        },
        clockedIn: { not: null },
        clockedTime: null,
      },
      select: {
        id: true,
        clockedIn: true,
        employee: {
          select: { id: true },
        },
      },
    });

    await prisma.$transaction(
      employeeLogs.reduce(
        (prev, log) => {
          if (!log.clockedIn) {
            return prev;
          }

          return [
            ...prev,
            prisma.shiftEmployeeLog.update({
              where: {
                id: log.id,
              },
              data: {
                clockedTime: differenceInMinutes(dateNow, log.clockedIn),
              },
            }),
          ];
        },
        [] as ReturnType<typeof prisma.shiftEmployeeLog.update>[],
      ),
    );

    revalidateTag(`shiftReport:id:${shiftId}`, "max");

    return NextResponse.json({ ok: true, data: null });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025" || err.code === "P2003") {
        return NextResponse.json(
          { ok: false, error: "Invalid shift" },
          { status: 404 },
        );
      }
    }

    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error accessing the database" },
      {
        status: 500,
      },
    );
  }
}
