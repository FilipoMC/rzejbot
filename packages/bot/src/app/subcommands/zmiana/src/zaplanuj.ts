import { AutocompleteHandler, SubcommandHandler } from "@/types/commands";
import { success } from "@/utils/commandResponses";
import { ApplicationCommandOptionChoiceData, codeBlock } from "discord.js";
import other from "@/config/other.json";

const scheduleShiftHandler: SubcommandHandler = async ({ interaction }) => {
  await success({
    interactionOrMsg: interaction,
    description: codeBlock(
      "json",
      JSON.stringify(interaction.options, null, 2),
    ),
    ephemeral: true,
  });
};

export default scheduleShiftHandler;

export const scheduleShiftAutocompleteHandler: AutocompleteHandler = async ({
  interaction,
}) => {
  const input = interaction.options.getString("kiedy", true);

  if (!input) {
    const fallbackAutoComp: ApplicationCommandOptionChoiceData[] = [];

    for (let i = 1; i <= 25; i++) {
      const defaultShiftTime = other.shifts.defaultShiftTime.split(":");

      if (!defaultShiftTime[0] || !defaultShiftTime[1]) {
        await interaction.respond([]);
        return;
      }

      const defaultDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        parseInt(defaultShiftTime[0]) || 0,
        parseInt(defaultShiftTime[1]) || 0,
        0,
        0,
      );

      const newDate = new Date(defaultDate.valueOf() + i * 24 * 60 * 60 * 1000);
      const [year, month, day, hour, minute] = newDate
        .toISOString()
        .split(/\D+/);

      if (typeof hour !== "string") {
        return;
      }

      fallbackAutoComp.push({
        name: `${day}/${month}/${year} ${String(parseInt(hour) - Math.round(new Date().getTimezoneOffset() / 60))}:${minute}`,
        value: newDate.toISOString(),
      });
    }
    await interaction.respond(fallbackAutoComp);
  } else {
    await interaction.respond([{ name: input, value: input }]);
  }
};
