import images from "@/config/images";
import { Logger } from "commandkit";

export const websiteUrl = `http://${process.env.SERVER_IP}${process.env.SERVER_PORT ? `:${process.env.SERVER_PORT}` : ""}`;

export const websitePages = {
  shiftPlan: (number: string) =>
    `${websiteUrl}/zmiana/${number.replaceAll("/", "-")}/plan`,
  shiftPlanPreview: (number: string, accessToken: string) =>
    `${websiteUrl}/zmiana/${number.replaceAll("/", "-")}/plan/podglad/${accessToken}`,
  shiftReport: (number: string) =>
    `${websiteUrl}/zmiana/${number.replaceAll("/", "-")}/raport`,
  shiftReportEdit: (number: string, accessToken: string) =>
    `${websitePages.shiftReport(number)}/edytuj/${accessToken}`,
  shiftReportPreview: (number: string, accessToken: string) =>
    `${websitePages.shiftReport(number)}/podglad/${accessToken}`,
};

export const shiftEventName = (number: string) => `Zmiana ${number}` as const;

export function getRandomImage(category: keyof typeof images) {
  const arr = images[category];
  if (!Array.isArray(arr)) {
    Logger.error({ msg: "Image config not an array", field: category });
    throw "oops config error in images its not an array";
  }

  return arr[Math.floor(Math.random() * arr.length)]!;
}
