import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { employeePatchSchema } from "@shared/zod/employeeSchemas";
import { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]">,
) {
  const { id } = await params;
  const includeChanges = req.nextUrl.searchParams.get("changes");
  const res = await prisma.employee.findUnique({
    where: { discordId: id },
    include: {
      qualification: {
        select: {
          pracownik: true,
          jadrowy: true,
          kierownikZmiany: true,
          szkoleniowiec: true,
        },
      },
      employeeChanges:
        includeChanges === "true" ?
          {
            select: {
              issuer: {
                omit: {
                  updatedAt: true,
                  createdAt: true,
                },
              },
              id: true,
              type: true,
              reason: true,
              note: true,
              newRole: true,
              updatedAt: true,
              createdAt: true,
            },
          }
        : false,
    },
  });
  if (!res) {
    return NextResponse.json(
      { ok: false, error: "Not Found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: res });
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]">,
) {
  const { id } = await params;
  const includeChanges = req.nextUrl.searchParams.get("changes");

  const bodyUnparsed = await req.json().catch(() => null);

  const body = employeePatchSchema.safeParse(bodyUnparsed);

  if (!body.success) {
    console.error(body.error);
    return NextResponse.json(
      { ok: false, error: "Invalid Body" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.employee.update({
      where: {
        discordId: id,
      },
      data: {
        ...body.data,
      },
      include: {
        qualification: {
          select: {
            pracownik: true,
            jadrowy: true,
            kierownikZmiany: true,
            szkoleniowiec: true,
          },
        },
        employeeChanges:
          includeChanges === "true" ?
            {
              select: {
                issuer: {
                  omit: {
                    updatedAt: true,
                    createdAt: true,
                  },
                },
                type: true,
                reason: true,
                note: true,
                newRole: true,
                updatedAt: true,
                createdAt: true,
              },
            }
          : false,
      },
    });

    return NextResponse.json({ ok: true, data: res }, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case "P2025":
          return NextResponse.json(
            {
              ok: false,
              error: "Not Found",
            },
            { status: 404 },
          );
        case "P2002":
          return NextResponse.json(
            {
              ok: false,
              error: `This ${(err.meta?.target as string[]).join(", ")} is already tied to an employee`,
            },
            { status: 409 },
          );
      }
    } else {
      console.error(err);
      return NextResponse.json(
        {
          ok: false,
          error: "Error accessing database",
        },
        { status: 500 },
      );
    }
  }
}
