import { prisma } from "@/lib/prisma";
import { shiftNumberSchema, shiftPostSchema } from "@/zod/shiftSchemas";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const shiftNumber = req.nextUrl.searchParams.get("number");

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    return NextResponse.json("Invalid number query parameter", {
      status: 400,
    });
  }

  const res = await prisma.shift.findUnique({
    where: { shiftNumber: shiftNumberParsed.data },
  });

  if (!res) {
    return NextResponse.json("Not found", { status: 404 });
  }

  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const bodyParsed = shiftPostSchema.safeParse(body);

  if (!bodyParsed.success) {
    return NextResponse.json("Invalid body", { status: 400 });
  }

  try {
    const res = await prisma.shift.create({
      data: {
        ...bodyParsed.data,
        host: { connect: { discordID: bodyParsed.data.host } },
      },
    });

    return NextResponse.json(res);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        `This ${(err.meta?.target as string[]).join(", ")} is already tied to a shift`,
        { status: 400 },
      );
    } else if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json("Invalid employee", { status: 404 });
    } else {
      console.error(err);
      return NextResponse.json("Error accessing the database", { status: 500 });
    }
  }
}
