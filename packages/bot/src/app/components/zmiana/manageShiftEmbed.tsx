import { ApiHelper, apiHelperUnsafe } from "@/helper/apiHelper";
import { bold, Client, EmbedBuilder, time, TimestampStyles } from "discord.js";
import { formatDate, addMinutes } from "date-fns";
import channels from "@/config/channels.json";

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

export async function sendShiftManageEmbed({
  client,
  shiftId,
}: SendShiftManageEmbedProps) {
  const shift = await apiHelperUnsafe(ApiHelper.shifts.getById, shiftId);

  const embed = new EmbedBuilder()
    .setTitle(`Zmiana ${shift.shiftNumber}`)
    .setDescription(
      `**Data zmiany:** ${time(shift.plannedDate, TimestampStyles.ShortDate)}\n`,
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
        value: getTimes("N/A", "N/A", "N/A"),
        inline: true,
      },
      { name: "Przydział stanowisk", value: "N/A" },
    ]);

  const channel = await client.channels.fetch(channels.ogloszeniaBlokow);

  if (!channel || !channel.isSendable()) {
    throw new Error("Invalid channel");
  }

  await channel.send({ embeds: [embed] });
}
