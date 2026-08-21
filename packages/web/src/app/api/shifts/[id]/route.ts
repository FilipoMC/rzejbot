import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<"/api/shifts/[id]">,
) {
  const { id } = await params;

  const shiftID = parseInt(id);

  if (isNaN(shiftID)) {
    return NextResponse.json("Invalid ID", { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: shiftID },
  });

  if (!shift) {
    return NextResponse.json("Not found", { status: 404 });
  }

  return NextResponse.json(shift);
}
//
// export async function PATCH(_req: NextRequest) { TODO: implementation

// }

// export async function DELETE(_req: NextRequest) {

// }
