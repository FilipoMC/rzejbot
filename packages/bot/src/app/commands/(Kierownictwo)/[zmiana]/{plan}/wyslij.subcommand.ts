import { sendShiftPlanSubmitEmbed } from "@/app/components/zmiana/shiftPlanSubmitEmbed";
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
  description: "Wyślij wiadomość planu zmiany na kanał kierowników zmiany",
  options: [
    {
      name: "zmiana",
      description: "Wewnętrzne id zmiany",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "event",
      description: "Opis eventu",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const shiftId = interaction.options.getNumber("zmiana", true);
  const eventDesc = interaction.options.getString("event", true);

  const res = await sendShiftPlanSubmitEmbed({
    client,
    shiftId,
    eventDesc,
  });

  if (res === "not found") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Podana zmiana nie istnieje",
    });
    return;
  }

  if (res === "approved") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Plan jest już zatwierdzony",
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
