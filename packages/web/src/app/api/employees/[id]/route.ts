import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]">,
) {
  const { id } = await params;

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

// export async function PATCH(_req: NextRequest) { TODO: implementation

// }

// export async function DELETE(_req: NextRequest) {

// }
