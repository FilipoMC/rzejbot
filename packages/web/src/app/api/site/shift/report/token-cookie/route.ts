import { hashAccessKey } from "@/lib/accessKeys";
import { prisma } from "@/lib/prisma";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const zodSchema = z.object({
  token: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const bodyUnparsed = await req
    .json()
    .catch(() => "JSON z prismy sie rozwalil");
  const bodyParsed = zodSchema.safeParse(bodyUnparsed);

  if (!bodyParsed.success) {
    console.error(bodyParsed.error);
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const body = bodyParsed.data;

  const shiftNumberParsed = shiftNumberSchema.safeParse(
    req.nextUrl.searchParams.get("number"),
  );
  const typeParsed = z
    .enum(["edit", "preview"])
    .safeParse(req.nextUrl.searchParams.get("type"));

  if (!shiftNumberParsed.success || !typeParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid number query parameter" },
      {
        status: 400,
      },
    );
  }

  const shiftNumber = shiftNumberParsed.data;
  const type = typeParsed.data;

  const res = await prisma.shiftReport.findFirst({
    where: {
      shift: {
        shiftNumber,
      },
      ...(type === "edit" ?
        { accessTokenHash: hashAccessKey(body.token) }
      : { previewAccessTokenHash: hashAccessKey(body.token) }),
    },
    select: { shiftId: true },
  });

  if (!res) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, data: null }, { status: 200 });

  response.cookies.set(
    `report_${type}_token_${shiftNumber.replace("/", "-")}`,
    body.token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/zmiana/${shiftNumber.replace("/", "-")}`,
      maxAge: 60 * 60 * 24 * 3,
    },
  );

  return response;
}
