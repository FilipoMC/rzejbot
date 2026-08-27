import shiftSubCommands from "@/app/subcommands/zmiana";
import config from "@/config/other.json";
import { handleSubcommands } from "@/utils/subcommands";
import { AutocompleteCommand, ChatInputCommand, CommandData } from "commandkit";
import {
  ApplicationCommandOptionChoiceData,
  ApplicationCommandOptionType,
  AutocompleteFocusedOption,
} from "discord.js";

export const command: CommandData = {
  name: "zmiana",
  description: "zarzadzaj zmianami",
  options: [
    {
      name: "zaplanuj",
      description: "zaplanuj zmiane",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "kiedy",
          description: "kiedy jest zmiana, w formacie DD/MM/YYYY HH:MM",
          required: true,
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
        },
      ],
    },
    // {
    //   name: "edytuj",
    //   description: "zaplanuj zmiane",
    //   type: ApplicationCommandOptionType.Subcommand
    // },
    // {
    //   name: "zakoncz",
    //   description: "zaplanuj zmiane",
    //   type: ApplicationCommandOptionType.Subcommand
    // }
  ],
};

export const chatInput: ChatInputCommand = async (ctx) => {
  await handleSubcommands(ctx, shiftSubCommands);
};
export const autocomplete: AutocompleteCommand = async (ctx) => {
  const { interaction } = ctx;
  const input = interaction.options.getString("kiedy", true);

  if (!input) {
    const fallbackAutoComp: ApplicationCommandOptionChoiceData[] = [];

    for (let i = 1; i <= 25; i++) {
      const defaultShiftTime = config.shifts.defaultShiftTime.split(":");

      if (!defaultShiftTime[0] || !defaultShiftTime[1]) return [];
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
        if (typeof hour !== "string") return;
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
