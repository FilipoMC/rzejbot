/* eslint-disable no-unused-vars */
import {
  APIEmbed,
  Interaction,
  BaseInteraction,
  EmbedBuilder,
  Message,
  MessageFlags,
} from "discord.js";
import * as embeds from "@/utils/embeds";
import { MiddlewareContext } from "commandkit";
import { throwLogger } from "./logger/loggingUtils";

async function conditionalReply(
  embed: EmbedBuilder | APIEmbed,
  ephemeral: boolean,
  interactionOrMessage: Message | Interaction,
) {
  const interaction =
    interactionOrMessage instanceof BaseInteraction ? interactionOrMessage : (
      null
    );
  const message =
    interactionOrMessage instanceof Message ? interactionOrMessage : null;
  if (interaction) {
    if (!interaction.isRepliable()) return;

    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply({ embeds: [embed] });
    } else {
      if (ephemeral) {
        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return await interaction.reply({
          embeds: [embed],
        });
      }
    }
  } else if (message) {
    if (!message)
      return throwLogger({ msg: "Message not found", desc: "", type: "error" });
    await message.reply({ embeds: [embed] });
  } else {
    return embed;
  }
}

interface params_generic {
  description: string;
  interactionOrMsg: Interaction | Message;
  ephemeral?: boolean;
}

export async function commandError({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
}: params_generic) {
  return await conditionalReply(
    embeds.createCommandErrorEmbed(description),
    ephemeral,
    interaction,
  );
}

export async function failedToExecute({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
}: params_generic) {
  return await conditionalReply(
    embeds.createFailEmbed(description),
    ephemeral,
    interaction,
  );
}

export async function noPermissions({
  interactionOrMsg: interaction,
  ephemeral = true,
}: Omit<params_generic, "description">) {
  return await conditionalReply(
    embeds.createNoPermissionEmbed(),
    ephemeral,
    interaction,
  );
}

export async function loading({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
}: params_generic) {
  return await conditionalReply(
    embeds.createLoadingEmbed(description),
    ephemeral,
    interaction,
  );
}

export async function success({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
}: params_generic) {
  return await conditionalReply(
    embeds.createSuccessEmbed(description),
    ephemeral,
    interaction,
  );
}

export async function middlewareReply(
  ctx: MiddlewareContext,
  embed?: EmbedBuilder,
) {
  if (ctx.isMessage()) {
    await ctx.message.reply({
      embeds: [embed ?? embeds.createNoPermissionEmbed()],
    });
  } else if (ctx.interaction instanceof BaseInteraction) {
    embed ?
      await conditionalReply(embed, true, ctx.interaction)
    : await noPermissions({ interactionOrMsg: ctx.interaction });
  }
}
