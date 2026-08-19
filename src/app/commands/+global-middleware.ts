import { CustomCommandMetadata } from "@/types/commands";
import { middlewareCheckPerms } from "@/utils/middleWareUtils";
import { MiddlewareContext, stopMiddlewares } from "commandkit";
import config from "@/config/config.json"
import { noPermissions } from "@/utils/commandResponses";
import { ChatInputCommandInteraction } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const metadata = ctx.command.metadata as CustomCommandMetadata;

  const wasRunInTestChnl = ctx.isMessage() ? (ctx.message.channel?.id !== config.testingChannelId) : (ctx.interaction.channel?.id !== config.testingChannelId && ctx.interaction instanceof ChatInputCommandInteraction)
  if (wasRunInTestChnl) {
    await noPermissions({interactionOrMsg: ctx.interaction})
    stopMiddlewares()
  }

  if (metadata.permissions) {
    middlewareCheckPerms(ctx);
  }
}
