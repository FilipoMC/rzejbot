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
  useFollowUp: boolean,
) {
  const interaction =
    interactionOrMessage instanceof BaseInteraction ? interactionOrMessage : (
      null
    );
  const message =
    interactionOrMessage instanceof Message ? interactionOrMessage : null;
  if (interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    if (interaction.replied || interaction.deferred) {
      if (!useFollowUp) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    } else {
      if (ephemeral) {
        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });

        return;
      } else {
        await interaction.reply({
          embeds: [embed],
        });

        return;
      }
    }
  } else if (message) {
    if (!message) {
      throwLogger({ msg: "Message not found", desc: "", type: "error" });

      return;
    }
    await message.reply({ embeds: [embed] });
  }
}

/**
 * @param DescOptional whether to allow description to be undefined
 */
interface params_generic<DescOptional extends boolean = false> {
  description: string | (DescOptional extends true ? undefined : string);
  interactionOrMsg: Interaction | Message;
  ephemeral?: boolean;
  useFollowUp?: boolean;
}

/**
 * Use this when there's an error during runtime, e.g issue with config
 * @param param0
 * @returns
 */
export async function commandError({
  description = undefined,
  interactionOrMsg: interaction,
  ephemeral = true,
  useFollowUp = false,
}: params_generic<true>) {
  await conditionalReply(
    embeds.createCommandErrorEmbed(description),
    ephemeral,
    interaction,
    useFollowUp,
  );
}

/**
 * Use this when the user fucked up, e.g bad arg input
 * @param param0
 * @returns
 */
export async function failedToExecute({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
  useFollowUp = false,
}: params_generic) {
  await conditionalReply(
    embeds.createFailEmbed(description),
    ephemeral,
    interaction,
    useFollowUp,
  );
}

/**
 * User does not have permission to use the command
 * @param param0
 * @returns
 */
export async function noPermissions({
  interactionOrMsg: interaction,
  ephemeral = true,
  useFollowUp = false,
}: Omit<params_generic, "description">) {
  await conditionalReply(
    embeds.createNoPermissionEmbed(),
    ephemeral,
    interaction,
    useFollowUp,
  );
}

export async function loading({
  description,
  interactionOrMsg: interaction,
  ephemeral = true,
  useFollowUp = false,
}: params_generic) {
  await conditionalReply(
    embeds.createLoadingEmbed(description),
    ephemeral,
    interaction,
    useFollowUp,
  );
}

export async function success({
  description = undefined,
  interactionOrMsg: interaction,
  ephemeral = true,
  useFollowUp = false,
}: params_generic<true>) {
  await conditionalReply(
    embeds.createSuccessEmbed(description),
    ephemeral,
    interaction,
    useFollowUp,
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
    if (embed) {
      await conditionalReply(embed, true, ctx.interaction, false);
    } else {
      await noPermissions({ interactionOrMsg: ctx.interaction });
    }
  }
}
