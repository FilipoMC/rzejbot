import TokenHandler from "@/components/handleReportCookies";
import { Metadata } from "next";

export default async function Page({
  params,
}: PageProps<"/zmiana/[shiftNumber]/raport/edytuj/[accessKey]">) {
  const { shiftNumber, accessKey } = await params;

  return <TokenHandler token={accessKey} number={shiftNumber} type="edit" />;
}

export async function generateMetadata({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan">): Promise<Metadata> {
  const { shiftNumber } = await params;

  return {
    title: `Edytowanie raportu zmiany - ${shiftNumber.replace("-", "/")}`,
    description: `Edytowanie raportu zmiany`,
    openGraph: {
      title: `Edytowanie raportu zmiany - ${shiftNumber.replace("-", "/")}`,
      description: `Edytowanie raportu zmiany`,
      siteName: "System teleinformatyczny ŻEJ",
    },
  };
}
