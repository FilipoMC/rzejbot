import { Metadata } from "next";
import TokenHandler from "./handler";

export default async function Page({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan/podglad/[accessKey]">) {
  const { shiftNumber, accessKey } = await params;

  return <TokenHandler token={accessKey} number={shiftNumber} type="preview" />;
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
