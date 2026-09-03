import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shiftLogStationsPostSchema } from "@shared/zod/shiftSchemas";
import { NextRequest, NextResponse } from "next/server";
import config from "@shared/config/config.json";

export async function GET(
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

  try {
    const res = await prisma.shiftEmployeeLog.findMany({
      where: {
        shiftId,
        stations: { isEmpty: false },
      },
      select: {
        shiftId: true,
        stations: true,
        rating: true,
        employee: { select: { discordId: true, nameIC: true } },
      },
    });

    const stationOrder = config.stations as Record<string, number>;
    const stations = [...new Set(res.flatMap((row) => row.stations))].sort(
      (a, b) => {
        const aVal = stationOrder[a] ?? Infinity;
        const bVal = stationOrder[b] ?? Infinity;

        return aVal - bVal || a.localeCompare(b);
      },
    );

    // TODO: Finish this
    const data = stations;

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error accessing the database" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs/stations">,
) {
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = shiftLogStationsPostSchema.safeParse(bodyUnparsed);

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

  const dateNow = new Date();

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
      select: { discordId: true, id: true, nameIC: true },
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

    const filteredBody = body.filter((row) =>
      employeeByIdentifier.has(row.employee.discordId ?? row.employee.nameIC),
    );

    const stationsByEmployee = new Map<
      number,
      { stations: string[]; dates: Date[] }
    >();

    for (const row of filteredBody) {
      const employeeId = employeeByIdentifier.get(
        row.employee.discordId ?? row.employee.nameIC,
      )!.id;

      const { stations, dates } = stationsByEmployee.get(employeeId) ?? {
        stations: [],
        dates: [],
      };
      stations.push(row.station);
      dates.push(row.date ?? dateNow);
      stationsByEmployee.set(employeeId, { stations, dates });
    }

    await prisma.$transaction(
      [...stationsByEmployee.entries()].map(
        ([employeeId, { stations, dates }]) =>
          prisma.shiftEmployeeLog.upsert({
            where: {
              shiftId_employeeId: {
                shiftId,
                employeeId,
              },
            },
            update: {
              stations: { push: stations },
              stationTimes: { push: dates },
            },
            create: {
              shift: { connect: { id: shiftId } },
              employee: { connect: { id: employeeId } },
              stations: { set: stations },
              stationTimes: { set: dates },
            },
          }),
      ),
    );

    return NextResponse.json({ ok: true, data: employeeResults });
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
      { ok: false, error: "Error accessing the database" },
      {
        status: 500,
      },
    );
  }
}
