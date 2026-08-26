import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<"/api/employees/[id]">,
) {
  const { id } = await params;

  const res = await prisma.employee.findUnique({
    where: { discordId: id },
  });
  if (!res) {
    return NextResponse.json("Not Found", { status: 404 });
  }

  return NextResponse.json({ data: res });
}

// export async function PATCH(_req: NextRequest) { TODO: implementation

// }

// export async function DELETE(_req: NextRequest) {

// }
