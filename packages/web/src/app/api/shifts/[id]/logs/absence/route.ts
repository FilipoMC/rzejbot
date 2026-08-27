import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shiftLogAbsencePostSchema } from "@shared/zod/shiftSchemas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/logs/absence">,
) {
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = shiftLogAbsencePostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    return NextResponse.json("Invalid body", { status: 400 });
  }

  const body = bodyParsed.data;
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json("Invalid shift ID", { status: 400 });
  }

  try {
    await prisma.shiftEmployeeLog.create({
      data: {
        employee: { connect: { discordId: body.employeeDiscordId } },
        shift: { connect: { id: shiftId } },
        absence: true,
      },
    });

    return NextResponse.json("Created shift log", { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          "The shift log for this employee already exists",
          { status: 409 },
        );
      }

      if (err.code === "P2025") {
        return NextResponse.json("Invalid employee or shift", { status: 404 });
      }
    }

    console.error(err);
    return NextResponse.json("Error accessing the database", {
      status: 500,
    });
  }
}
