import { GroupMap, SubcommandMap } from "@/types/commands";
import { ChatInputCommandContext } from "commandkit";

export const UNGROUPED_SUBCOMMAND_GROUP_NAME = "not grouped";

export async function handleSubcommands<T = void>(
  ctx: ChatInputCommandContext,
  subcommandMap: SubcommandMap<T>,
): Promise<T> {
  const handler = subcommandMap[ctx.options.getSubcommand()];

  if (!handler) throw new Error("Custom error: Subcommand not found");

  return await handler(ctx);
}

export async function handleSubcommandsWithGroups<T = void>(
  ctx: ChatInputCommandContext,
  groupMap: GroupMap<T>,
): Promise<T> {
  const subcommand = ctx.options.getSubcommand();
  const subcommandGroup = ctx.options.getSubcommandGroup();

  const group =
    subcommandGroup ? subcommandGroup : UNGROUPED_SUBCOMMAND_GROUP_NAME;
  const subcommandMap = groupMap[group];

  if (!subcommandMap)
    throw new Error("Custom error: Subcommand group not found");

  const handler = subcommandMap[subcommand];

  if (!handler) throw new Error("Custom error: Subcommand not found");

  return await handler(ctx);
}
