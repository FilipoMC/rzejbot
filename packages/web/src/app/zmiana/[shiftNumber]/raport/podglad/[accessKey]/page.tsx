import { hashAccessKey } from "@/lib/accessKeys";
import { prisma } from "@/lib/prisma";
import { toPlain } from "@/lib/utils";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { RaportZmianyComponent } from "../../page";

async function getShiftReport(number: string, accessKey: string) {
  "use cache";
  cacheTag("all");
  cacheTag(`shiftReport:number:${number}`);
  cacheTag(`shiftReportEdit:number:${number}`);
  cacheLife("days");

  const res = await prisma.shiftReport.findFirst({
    where: {
      shift: { shiftNumber: number },
      previewAccessTokenHash: hashAccessKey(accessKey),
    },
    select: {
      approved: true,
      shift: { select: { shiftNumber: true, id: true } },
    },
  });

  if (!res) {
    return null;
  }

  cacheTag(`shiftReport:id:${res.shift.id}`);
  cacheTag(`shiftReportEdit:id:${res.shift.id}`);

  return toPlain(res);
}

export default async function RaportZmiany(
  props: PageProps<"/zmiana/[shiftNumber]/raport/[accessKey]">,
) {
  const { shiftNumber, accessKey } = await props.params;

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    notFound();
  }

  const shiftReport = await getShiftReport(shiftNumberParsed.data, accessKey);

  if (!shiftReport || shiftReport.approved) {
    notFound();
  }

  return RaportZmianyComponent({ shiftNumber, isPreview: true });
}

export async function generateMetadata({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan">): Promise<Metadata> {
  const { shiftNumber } = await params;

  return {
    title: `Podgląd raportu zmiany - ${shiftNumber.replace("-", "/")}`,
    description: `Podgląd raportu zmiany`,
    openGraph: {
      title: `Podgląd raportu zmiany - ${shiftNumber.replace("-", "/")}`,
      description: `Podgląd raportu zmiany`,
      siteName: "System teleinformatyczny ŻEJ",
    },
  };
}
