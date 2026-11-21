import TokenHandler from "@/components/handleReportCookies";

export default async function Page({
  params,
}: PageProps<"/zmiana/[shiftNumber]/raport/podglad/[accessKey]">) {
  const { shiftNumber, accessKey } = await params;

  return <TokenHandler token={accessKey} number={shiftNumber} type="preview" />;
}
