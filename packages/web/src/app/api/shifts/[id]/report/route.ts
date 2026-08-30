import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  shiftReportPatchSchema,
  shiftReportPostSchema,
} from "@shared/zod/shiftSchemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/report">,
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
    const res = await prisma.shiftReport.findUnique({
      where: { shiftId },
      include: {
        cohost: { select: { discordId: true } },
        shift: { select: { shiftNumber: true } },
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

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/report">,
) {
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = shiftReportPostSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.shiftReport.create({
      data: {
        ...body,
        shift: { connect: { id: shiftId } },
        cohost:
          body.cohost ? { connect: { discordId: body.cohost } } : undefined,
      },
      include: {
        cohost: { select: { discordId: true } },
        shift: { select: { shiftNumber: true } },
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
      if (err.code === "P2014") {
        return NextResponse.json(
          {
            ok: false,
            error: "This shift already has a report",
          },

          { status: 409 },
        );
      }

      if (err.code === "P2025") {
        return NextResponse.json(
          { ok: false, error: "Invalid employee or shift" },
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

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]/report">,
) {
  const bodyUnparsed = await req.json().catch(() => null);
  const bodyParsed = shiftReportPatchSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;
  const { id: idParam } = await params;

  const shiftId = Number(idParam);

  if (!Number.isInteger(shiftId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid shift ID" },
      { status: 400 },
    );
  }

  const cohost:
    | Prisma.EmployeeUpdateOneWithoutShiftReportsNestedInput
    | undefined =
    body.cohost === null ? { disconnect: true }
    : body.cohost !== undefined ? { connect: { discordId: body.cohost } }
    : undefined;

  try {
    const res = await prisma.shiftReport.update({
      where: {
        shiftId,
      },
      data: {
        ...body,
        cohost,
      },
      include: {
        cohost: { select: { discordId: true } },
        shift: { select: { shiftNumber: true } },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: res,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { ok: false, error: "Invalid employee or shift report" },
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
