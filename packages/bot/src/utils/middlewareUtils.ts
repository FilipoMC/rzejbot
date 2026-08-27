import { MiddlewareContext, stopMiddlewares } from "commandkit";
import { middlewareReply } from "./commandResponses";
import { hasPermissions } from "./utilityFunctions";
import { CustomCommandMetadata } from "@/types/commands";
import { GuildMember } from "discord.js";
import _ from "lodash";
import config from "@/config/config.json";

export function middlewareCheckPerms(ctx: MiddlewareContext) {
  if (ctx.isMessage() ? !ctx.message.guild : !ctx.interaction.inCachedGuild())
    stopMiddlewares();

  const metadata = ctx.command.metadata as CustomCommandMetadata;
  const commandMember =
    ctx.isMessage() ? ctx.message.member : ctx.interaction.member;

  if (!commandMember) {
    return;
  }

  if (!(commandMember instanceof GuildMember)) {
    stopMiddlewares();
  }

  if (
    !hasPermissions({
      member: commandMember,
      ...metadata.permissions,
    })
  ) {
    middlewareReply(ctx);

    stopMiddlewares();
  }
}

export function localMiddleware(
  ctx: MiddlewareContext,
  params: CustomCommandMetadata,
) {
  if (
    _.isEmpty(ctx.command.metadata) ||
    (_.keys(ctx.command.metadata).length === 1 &&
      ctx.command.metadata.aliases !== undefined)
  )
    return;
  if (params.permissions) {
    _.merge(ctx.command.metadata, params);
    middlewareCheckPerms(ctx);
  }
  if (params.devonly) {
    const commandUserId =
      ctx.isMessage() ? ctx.message.author.id : ctx.interaction.user.id;
    if (!config.devs.includes(commandUserId)) {
      middlewareReply(ctx);

      stopMiddlewares();
    }
  }
}
