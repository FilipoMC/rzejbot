import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shiftLogPresencePostSchema } from "@shared/zod/shiftSchemas";
import { differenceInMinutes } from "date-fns";
import _ from "lodash";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs/stations">,
) {
  const bodyUnparsed = await req
    .json()
    .catch(() => "JSON z prismy sie rozwalil");
  const bodyParsed = shiftLogPresencePostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;
  const { id: shiftIdParam } = await params;

  const shiftId = Number(shiftIdParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  try {
    const discordIds = body
      .map((row) => row.employee.discordId)
      .filter((id): id is string => id !== null);

    const namesIC = body
      .map((row) => row.employee.nameIC)
      .filter((name): name is string => name !== null);

    const employees = await prisma.employee.findMany({
      where: {
        OR: [{ discordId: { in: discordIds } }, { nameIC: { in: namesIC } }],
      },
      select: {
        discordId: true,
        id: true,
        nameIC: true,
        shiftLogs: {
          where: { shiftId },
          select: { clockedIn: true, clockedTime: true },
        },
      },
    });

    const employeeByIdentifier = new Map([
      ...employees.map((employee) => [employee.discordId, employee] as const),
      ...employees.map((employee) => [employee.nameIC, employee] as const),
    ]);

    const employeeResults = body.map((row) => {
      const identifier = row.employee.discordId ?? row.employee.nameIC;
      const employee = employeeByIdentifier.get(identifier);

      if (employee) {
        return {
          found: true,
          employeeDiscordId: employee.discordId,
          employeeNameIC: employee.nameIC,
        };
      }

      return {
        found: false,
        employeeDiscordId: row.employee.discordId,
        employeeNameIC: row.employee.nameIC,
      };
    });

    const dateNow = new Date();

    await prisma.$transaction(
      body.reduce(
        (prev, row) => {
          const employee = employeeByIdentifier.get(
            row.employee.discordId ?? row.employee.nameIC,
          );

          if (!employee) {
            return prev;
          }

          const data: Prisma.ShiftEmployeeLogUpdateInput = {};

          if (row.action === "clock_in") {
            if (employee.shiftLogs[0].clockedIn === null) {
              data.clockedIn = dateNow;
            }
            if (employee.shiftLogs[0].clockedTime !== null) {
              data.clockedTime = null;
            }
          } else {
            if (employee.shiftLogs[0].clockedIn !== null) {
              data.clockedTime = differenceInMinutes(
                dateNow,
                employee.shiftLogs[0].clockedIn,
              );
            }
          }

          if (_.isEmpty(data)) {
            return prev;
          }

          return [
            ...prev,
            prisma.shiftEmployeeLog.update({
              where: {
                shiftId_employeeId: {
                  shiftId,
                  employeeId: employee.id,
                },
              },
              data,
            }),
          ];
        },
        [] as ReturnType<typeof prisma.shiftEmployeeLog.update>[],
      ),
    );

    revalidateTag(`shiftReport:id:${shiftId}`, "max");

    return NextResponse.json({ ok: true, data: employeeResults });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        console.log(err);
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid shift/employee wasn't logged in the shift",
          },
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
