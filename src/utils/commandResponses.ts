/* eslint-disable no-unused-vars */
import { APIEmbed, BaseInteraction, EmbedBuilder, Message, MessageFlags } from "discord.js";
import * as embeds from "@/config/embeds.ts"
import {
  getContext,
  MiddlewareContext,
  useEnvironment,
} from "commandkit";
import { throwLogger } from "./logger/loggingUtils";

async function conditionalReply(
  embed: EmbedBuilder | APIEmbed,
  ephemeral: boolean,
  interactionOrMessage?: Message | BaseInteraction
) {
  const interaction = interactionOrMessage instanceof BaseInteraction ? interactionOrMessage : null
  const message = interactionOrMessage instanceof Message ? interactionOrMessage : null
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
    if (!message) return throwLogger({msg: "Message not found", desc: "", type: "error"})
    await message.reply({embeds: [embed]})
  } else {
    return embed;
  }
}

export interface generic_Params {
  description?: string,
  interactionOrMsg?: BaseInteraction | Message,
  ephemeral?: boolean
}

export async function commandError({description, interactionOrMsg: interaction, ephemeral = true}: generic_Params) {
  return await conditionalReply(embeds.commandError(description), ephemeral, interaction);
}

export async function failedToExecute({description, interactionOrMsg: interaction, ephemeral = true}: generic_Params) {
  return await conditionalReply(embeds.fail(description), ephemeral, interaction);
}

export async function noPermissions({interactionOrMsg: interaction, ephemeral = true}: generic_Params) {
  return await conditionalReply(embeds.noPermission(), ephemeral, interaction);
}

export async function loading({description, interactionOrMsg: interaction, ephemeral = true}: generic_Params) {
  return await conditionalReply(embeds.loading(description), ephemeral, interaction);
}

export async function success({description, interactionOrMsg: interaction, ephemeral = true} : generic_Params) {
  return await conditionalReply(embeds.success(description), ephemeral, interaction);
}

export function middlewareReply(ctx: MiddlewareContext) {
  if (ctx.isMessage()) {
    ctx.message.reply({ embeds: [embeds.noPermission()] }); 
  } else if (ctx.interaction instanceof BaseInteraction) {
    noPermissions({interactionOrMsg: ctx.interaction});
  } else return;
}

/**
 * Replies to a command - detects whether it's a message or interaction, replies or editReply based on that
 * Context is acquired from the call stack; throws if not found - only call with a context
 * Use commandReplySafe for environments where there could be no context
 * @deprecated Use 'conditionalReply' function instead
 */
export async function commandReply(embed: EmbedBuilder) { // DEPRECATED
  const ctx = useEnvironment().context;
  if (!ctx) throw new Error("Context not found in the environment");

  if (ctx.isMessage()) await ctx.message.reply({ embeds: [embed] });
  else if (ctx.interaction.isRepliable()) {
    if (!ctx.interaction.replied && !ctx.interaction.deferred) {
      await ctx.interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await ctx.interaction.editReply({ embeds: [embed] });
    }
  }
}

/**
 * Replies to a command - detects whether it's a message or interaction, replies or editReply based on that
 * Context is acquired from the call stack; no effect if not found
 * @deprecated Use 'conditionalReply' instead
 */
export async function commandReplySafe(embed: EmbedBuilder) { // DEPRECATED
  const ctx = getContext()?.context;
  if (!ctx) return;

  if (ctx.isMessage()) await ctx.message.reply({ embeds: [embed] });
  else if (ctx.interaction.isRepliable()) {
    if (!ctx.interaction.replied && !ctx.interaction.deferred) {
      await ctx.interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await ctx.interaction.editReply({ embeds: [embed] });
    }
  }
}
