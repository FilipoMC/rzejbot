import { hashAccessKey } from "@/lib/accessKeys";
import { prisma } from "@/lib/prisma";
import { toPlain } from "@/lib/utils";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { PlanZmianyComponent } from "../page";
import { cookies } from "next/headers";

async function getShiftPlan(number: string, accessKey: string) {
  "use cache";
  cacheTag("all");
  cacheTag(`shift:number:${number}`);
  cacheLife("days");
  const res = await prisma.shift.findFirst({
    where: {
      shiftNumber: number,
      previewAccessTokenHash: hashAccessKey(accessKey),
    },
    select: {
      approved: true,
      shiftNumber: true,
      id: true,
    },
  });

  if (!res) {
    return null;
  }

  cacheTag(`shift:id:${res.id}`);

  return toPlain(res);
}

export default async function PlanZmiany(
  props: PageProps<"/zmiana/[shiftNumber]/plan/podglad">,
) {
  const { shiftNumber } = await props.params;

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    notFound();
  }

  const cookieStore = await cookies();

  const accessKey = cookieStore.get(
    `shift_preview_token_${shiftNumberParsed.data.replace("/", "-")}`,
  )?.value;

  if (!accessKey) {
    notFound();
  }

  const shift = await getShiftPlan(shiftNumberParsed.data, accessKey);

  if (!shift) {
    notFound();
  }

  if (shift.approved) {
    redirect(`/zmiana/${shiftNumber}/plan`);
  }

  return PlanZmianyComponent({ shiftNumber, isPreview: true });
}

export async function generateMetadata({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan">): Promise<Metadata> {
  const { shiftNumber } = await params;

  return {
    title: `Podgląd planu zmiany - ${shiftNumber.replace("-", "/")}`,
    description: `Podgląd planu zmiany`,
    openGraph: {
      title: `Podgląd planu zmiany - ${shiftNumber.replace("-", "/")}`,
      description: `Podgląd planu zmiany`,
      siteName: "System teleinformatyczny ŻEJ",
    },
  };
}
