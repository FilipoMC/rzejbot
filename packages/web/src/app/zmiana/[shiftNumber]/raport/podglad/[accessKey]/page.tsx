import TokenHandler from "@/components/handleReportCookies";
import { Metadata } from "next";

export default async function Page({
  params,
}: PageProps<"/zmiana/[shiftNumber]/raport/podglad/[accessKey]">) {
  const { shiftNumber, accessKey } = await params;

  return <TokenHandler token={accessKey} number={shiftNumber} type="preview" />;
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
