import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shiftLogPresenceInitialPostSchema } from "@shared/zod/shiftSchemas";
import _ from "lodash";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs/stations">,
) {
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = shiftLogPresenceInitialPostSchema.safeParse(bodyUnparsed);

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
    const employees = await prisma.employee.findMany({
      select: { discordId: true, id: true, nameIC: true },
    });

    const discordIds = body
      .map((row) => row.employee.discordId)
      .filter((id): id is string => id !== null);

    const namesIC = body
      .map((row) => row.employee.nameIC)
      .filter((name): name is string => name !== null);

    const employeeIdentifiers = new Set([...discordIds, ...namesIC]);
    const employeeByIdentifier = new Map([
      ...employees.map((employee) => [employee.discordId, employee] as const),
      ...employees.map((employee) => [employee.nameIC, employee] as const),
    ]);

    const [presentEmployees, absentEmployees] = _.partition(
      employees,
      (v) =>
        employeeIdentifiers.has(v.discordId) ||
        employeeIdentifiers.has(v.nameIC),
    );

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

    await prisma.$transaction([
      ...presentEmployees.map((v) =>
        prisma.shiftEmployeeLog.upsert({
          where: {
            shiftId_employeeId: {
              shiftId,
              employeeId: v.id,
            },
          },
          update: {
            clockedIn: dateNow,
          },
          create: {
            shift: { connect: { id: shiftId } },
            employee: { connect: { id: v.id } },
            clockedIn: dateNow,
          },
        }),
      ),
      prisma.shiftEmployeeLog.createMany({
        data: absentEmployees.map((v) => ({
          shiftId,
          employeeId: v.id,
        })),
        skipDuplicates: true,
      }),
    ]);

    return NextResponse.json({ ok: true, data: employeeResults });
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
