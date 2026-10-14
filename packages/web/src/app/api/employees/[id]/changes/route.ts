import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { snowflakeSchema } from "@shared/zod/discordSchemas";
import { employeeWithChangesPostSchema } from "@shared/zod/employeeSchemas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]/changes">,
) {
  const { id } = await params;
  const parsedDcId = snowflakeSchema.safeParse(id);
  if (!parsedDcId.success) {
    return NextResponse.json(
      { ok: false, error: "Bad Request" },
      { status: 400 },
    );
  }
  const body = await req.json().catch(() => null);
  const bodyParsed = employeeWithChangesPostSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid Body" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.employeeChange.create({
      data: {
        employee: {
          connect: {
            discordId: parsedDcId.data,
          },
        },
        ...bodyParsed.data,
      },
    });
    return NextResponse.json({ ok: true, data: res }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { ok: false, error: "Not Found" },
        { status: 404 },
      );
    } else {
      console.log(err);
      return NextResponse.json(
        { ok: false, error: "Internal Error" },
        { status: 500 },
      );
    }
  }
}
