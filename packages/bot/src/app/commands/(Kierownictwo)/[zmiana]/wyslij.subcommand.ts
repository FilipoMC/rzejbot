import { sendShiftManageEmbed } from "@/app/components/zmiana/manageShiftEmbed";
import { CustomCommandMetadata } from "@/types/commands";
import {
  commandError,
  commandSuccess,
  failedToExecute,
} from "@/utils/commandResponses";
import { rankGroups } from "@shared/config/ranks";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";

export const command: CommandData = {
  name: "wyslij",
  description: "Wyślij embed zmiany na kanał ogłoszeń",
  options: [
    {
      name: "zmiana",
      description: "Numer zmiany",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const shift = interaction.options.getString("zmiana");

  const res = await sendShiftManageEmbed({
    client,
    shiftIdentifier: shift ? { number: shift } : undefined,
  });

  if (res === "not found") {
    if (shift) {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: "Podana zmiana nie istnieje",
      });
    } else {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: "Nie ma aktualnie żadnej zmiany",
      });
    }

    return;
  }

  if (res === "invalidArg") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Niepoprawny format numeru zmiany",
    });

    return;
  }

  if (res === "error") {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
    return;
  }

  await commandSuccess({
    interactionOrMsg: interaction,
    description: undefined,
  });
};

export const metadata: CustomCommandMetadata = {
  devSkipPermsCheck: true,
  permissions: {
    allowedRoles: [
      ...rankGroups["Kierownictwo Elektrowni"].id,
      ...rankGroups["Kierownictwo Bloków"].id,
    ],
  },
};
