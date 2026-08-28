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
    include: {
      host: {
        select: {
          discordId: true,
        },
      },
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
}

export async function POST(req: NextRequest) {
  const bodyUnparsed = await req.json().catch(() => null);

  const bodyParsed = shiftPostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
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
      include: {
        host: { select: { discordId: true } },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: res,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          {
            ok: false,
            error: `This shiftNumber is already tied to a shift`,
          },

          { status: 409 },
        );
      }

      if (err.code === "P2025") {
        return NextResponse.json(
          { ok: false, error: "Invalid employee" },
          { status: 404 },
        );
      }
    }

    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error accessing the database" },
      { status: 500 },
    );
  }
}
