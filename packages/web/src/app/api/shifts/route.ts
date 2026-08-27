import { prisma } from "@/lib/prisma";
import { shiftNumberSchema, shiftPostSchema } from "@shared/zod/shiftSchemas";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const shiftNumberUnparsed = req.nextUrl.searchParams.get("number");

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumberUnparsed);

  if (!shiftNumberParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid number query parameter" },
      {
        status: 400,
      },
    );
  }

  const shiftNumber = shiftNumberParsed.data;

  const res = await prisma.shift.findUnique({
    where: { shiftNumber },
  });

  if (!res) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const bodyUnparsed = await req.json().catch(() => null);

  const bodyParsed = shiftPostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;

  try {
    const res = await prisma.shift.create({
      data: {
        ...body,
        host: { connect: { discordId: body.host } },
      },
    });

    return NextResponse.json({ ok: true, data: res }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          `This ${(err.meta?.target as string[]).join(", ")} is already tied to a shift`,
          { status: 409 },
        );
      }

      if (err.code === "P2025") {
        return NextResponse.json("Invalid employee", { status: 404 });
      }
    }

    console.error(err);
    return NextResponse.json(
      { ok: false, errpr: "Error accessing the database" },
      { status: 500 },
    );
  }
}
