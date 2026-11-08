import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shiftPatchSchema } from "@shared/zod/shiftSchemas";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]">,
) {
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.shift.findUnique({
      where: { id: shiftId },
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
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error accessing the database" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]">,
) {
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  const bodyUnparsed = await req.json().catch(() => null);

  const bodyParsed = shiftPatchSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;

  try {
    const res = await prisma.shift.update({
      where: {
        id: shiftId,
      },
      data: {
        ...body,
        host:
          body.host !== undefined ?
            { connect: { discordId: body.host, system: false } }
          : undefined,
      },
      include: {
        host: { select: { discordId: true } },
      },
    });

    revalidateTag(`shift:number:${res.shiftNumber}`, "max");

    return NextResponse.json(
      {
        ok: true,
        data: res,
      },
      { status: 200 },
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
