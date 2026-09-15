import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { loaPostSchema } from "@shared/zod/employeeSchemas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]/loa">,
) {
  const { id } = await params;
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = loaPostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;
  try {
    const prismaRes = await prisma.lOA.create({
      data: {
        employee: {
          connect: { discordId: id },
        },
        ...body,
      },
      include: {
        employee: { select: { discordId: true } },
      },
    });
    return NextResponse.json({ ok: true, data: prismaRes }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid Employee ID",
        },
        { status: 404 },
      );
    } else {
      console.error(err);
      return NextResponse.json(
        { ok: false, error: "Error accessing the database" },
        { status: 500 },
      );
    }
  }
}
