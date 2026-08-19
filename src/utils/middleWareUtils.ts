import { MiddlewareContext, stopMiddlewares } from "commandkit";
import { middlewareReply } from "./commandResponses";
import { hasPermissions } from "./utilityFunctions";
import { CustomCommandMetadata } from "@/types/commands";

export function middlewareCheckPerms(ctx: MiddlewareContext) {
  if (ctx.isMessage() ? !ctx.message.guild : !ctx.interaction.inCachedGuild())
    stopMiddlewares();

  const metadata = ctx.command.metadata as CustomCommandMetadata;
  const commandMember =
    ctx.isMessage() ? ctx.message.member : ctx.interaction.member;

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
