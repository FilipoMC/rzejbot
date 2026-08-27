import shiftSubcommands, { shiftAutocomplete } from "@/app/subcommands/zmiana";
import { handleAutocomplete, handleSubcommands } from "@/utils/subcommands";
import { AutocompleteCommand, ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";

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
    //   type: ApplicationCommandOptionType.Subcommand,
    // },
    // {
    //   name: "zakoncz",
    //   description: "zaplanuj zmiane",
    //   type: ApplicationCommandOptionType.Subcommand
    // }
  ],
};

export const chatInput: ChatInputCommand = async (ctx) => {
  await handleSubcommands(ctx, shiftSubcommands);
};

export const autocomplete: AutocompleteCommand = async (ctx) => {
  await handleAutocomplete(ctx, shiftAutocomplete);
};
