import { prisma } from "@/lib/prisma";
import { employeePostSchema } from "@shared/zod/employeeSchemas";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsedBody = employeePostSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  try {
    const res = await prisma.employee.create({
      data: parsedBody.data,
    });

    return NextResponse.json({ ok: true, data: res }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `This ${(err.meta?.target as string[]).join(", ")} is already tied to an employee`,
        },
        { status: 409 },
      );
    } else {
      console.error(err);
      return NextResponse.json(
        { ok: false, error: "Error accessing the database" },
        { status: 500 },
      );
    }
  }
}
