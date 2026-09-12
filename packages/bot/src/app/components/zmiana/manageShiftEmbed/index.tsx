import { ApiHelper } from "@/helper/apiHelper";
import { BaseMessageOptions, Client } from "discord.js";
import channels from "@/config/channels.json";
import { Logger } from "commandkit";
import { createManageShiftEmbedStage1Components } from "./stage1";
import { getShiftManageEmbed } from "./utils";
import { createManageShiftEmbedStage2Components } from "./stage2";
import { createManageShiftEmbedStage3Components } from "./stage3";

interface SendShiftManageEmbedProps {
  client: Client;
  shiftIdentifier?:
    | {
        id: number;
      }
    | { number: string };
}

export async function sendShiftManageEmbed({
  client,
  shiftIdentifier,
}: SendShiftManageEmbedProps): Promise<"not found" | "error" | undefined> {
  let shiftRes;

  if (!shiftIdentifier) {
    shiftRes = await ApiHelper.shifts.getActive();
  } else if ("id" in shiftIdentifier) {
    shiftRes = await ApiHelper.shifts.getById(shiftIdentifier.id);
  } else {
    shiftRes = await ApiHelper.shifts.getByShiftNumber(shiftIdentifier.number);
  }
  if (shiftRes.status === "apiError" && shiftRes.errorStatus === "notFound") {
    return "not found";
  } else if (shiftRes.status !== "ok") {
    Logger.error(shiftRes);
    return "error";
  }

  const shift = shiftRes.data;

  const shiftReportRes = await ApiHelper.shifts.report.get(shift.id);

  const isReportNotFound =
    shiftReportRes.status === "apiError" &&
    shiftReportRes.errorStatus === "notFound";

  if (!isReportNotFound && shiftReportRes.status !== "ok") {
    Logger.error(shiftReportRes);
    return "error";
  }

  const shiftReport =
    shiftReportRes.status === "ok" ? shiftReportRes.data : null;

  const channel = await client.channels.fetch(channels.ogloszeniaBlokow);

  if (!channel || !channel.isSendable()) {
    Logger.error("invalid channel in sendShiftManageEmbed");
    throw new Error("Invalid channel");
  }

  let embed;
  let components: BaseMessageOptions["components"];

  const getStations = async () => {
    const stationsRes = await ApiHelper.shifts.stations.get(shift.id);

    const isStationsNotFound =
      stationsRes.status === "apiError" &&
      stationsRes.errorStatus === "notFound";

    if (!isStationsNotFound && stationsRes.status !== "ok") {
      Logger.error(stationsRes);
      return [];
    }

    return stationsRes.status === "ok" ? stationsRes.data : [];
  };

  if (!shiftReport) {
    components = createManageShiftEmbedStage1Components(shift);
    embed = getShiftManageEmbed(shift);
  } else if (shiftReport.briefingDuration === null) {
    const stations = await getStations();

    components = createManageShiftEmbedStage2Components(
      shift,
      shiftReport,
      stations,
    );
    embed = getShiftManageEmbed(shift, shiftReport, stations);
  } else if (shiftReport.duration === null) {
    const stations = await getStations();

    components = createManageShiftEmbedStage3Components(
      shift,
      shiftReport,
      stations,
    );
    embed = getShiftManageEmbed(shift, shiftReport, stations);
  } else {
    const stations = await getStations();

    components = [];
    embed = getShiftManageEmbed(shift, shiftReport, stations);
  }

  await channel.send({
    embeds: [embed],
    components,
  });
}
