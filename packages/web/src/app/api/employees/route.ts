import { prisma } from "@/lib/prisma";
import { employeePostSchema } from "@/zod/employeeSchemas";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsedBody = employeePostSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json("Invalid body", { status: 400 });
  }

  try {
    const res = await prisma.employee.create({
      data: parsedBody.data,
    });

    return NextResponse.json({ data: res });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        `This ${(err.meta?.target as string[]).join(", ")} is already tied to an employee`,
        { status: 400 },
      );
    } else {
      console.error(err);
      return NextResponse.json("Error accessing the database", { status: 500 });
    }
  }
}
