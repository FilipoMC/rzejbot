import { ApiHelper, apiHelperUnsafe } from "@/helper/apiHelper";
import {
  Client,
  EmbedBuilder,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { addMinutes } from "date-fns";
import channels from "@/config/channels.json";
import { Logger } from "commandkit";
import { ShiftAPIResponse, ShiftReportAPIResponse } from "@shared/types/api";
import { createManageShiftEmbedStage1Components } from "./stage1";

interface SendShiftManageEmbedProps {
  client: Client;
  shiftId: number;
}

function getTimes(a: string, b: string, c: string) {
  return (
    `Rozpocz. briefingu: ${a}\n` +
    `Rozpoczęcia zmiany: ${b}\n` +
    `Zakończenia zmiany: ${c}\n`
  );
}

export function getShiftManageEmbed(
  shift: ShiftAPIResponse,
  shiftReport?: ShiftReportAPIResponse,
) {
  const a =
    shiftReport?.date ?
      time(shiftReport.date, TimestampStyles.ShortTime)
    : "N/A";

  const b =
    shiftReport?.briefingDuration || shiftReport?.briefingDuration === 0 ?
      time(
        addMinutes(shiftReport.date, shiftReport.briefingDuration),
        TimestampStyles.ShortTime,
      )
    : "N/A";

  const c =
    (
      (shiftReport?.briefingDuration || shiftReport?.briefingDuration === 0) &&
      (shiftReport?.duration || shiftReport.duration === 0)
    ) ?
      time(
        addMinutes(
          shiftReport.date,
          shiftReport.briefingDuration + shiftReport.duration,
        ),
        TimestampStyles.ShortTime,
      )
    : "N/A";

  return new EmbedBuilder()
    .setTitle(`Zmiana ${shift.shiftNumber}`)
    .setDescription(
      `**Data zmiany:** ${time(shift.plannedDate, TimestampStyles.ShortDate)}\n` +
        `**Kierownik zmiany:** ${userMention(shift.host.discordId)}\n` +
        (shiftReport?.cohost?.discordId ?
          `**Nadzorujący przełożony:** ${userMention(shiftReport.cohost.discordId)}`
        : ""),
    )
    .setFields([
      {
        name: "Planowany czas",
        value: getTimes(
          time(shift.plannedDate, TimestampStyles.ShortTime),
          time(
            addMinutes(shift.plannedDate, shift.plannedBriefingDuration),
            TimestampStyles.ShortTime,
          ),
          time(
            addMinutes(
              shift.plannedDate,
              shift.plannedBriefingDuration + shift.plannedDuration,
            ),
            TimestampStyles.ShortTime,
          ),
        ),
        inline: true,
      },
      {
        name: "Rzeczywisty czas",
        value: getTimes(a, b, c),
        inline: true,
      },
      { name: "Przydział stanowisk", value: "N/A" },
    ]);
}

export async function sendShiftManageEmbed({
  client,
  shiftId,
}: SendShiftManageEmbedProps) {
  const shift = await apiHelperUnsafe(ApiHelper.shifts.getById, shiftId);

  const embed = getShiftManageEmbed(shift);
  const channel = await client.channels.fetch(channels.ogloszeniaBlokow);

  if (!channel || !channel.isSendable()) {
    Logger.error("invalid channel in sendShiftManageEmbed");
    throw new Error("Invalid channel");
  }

  await channel.send({
    embeds: [embed],
    components: createManageShiftEmbedStage1Components(shift),
  });
}
