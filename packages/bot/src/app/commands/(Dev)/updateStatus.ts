import { kvKeys } from "@/config/other";
import { CustomCommandMetadata } from "@/types/commands";
import kv from "@/utils/kv";
import { updateBotPresence } from "@/utils/utilityFunctions";
import { CommandData, COMMANDKIT_IS_DEV, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "su",
  description: "Update the bot's status",
};

export const message: MessageCommand = async (ctx) => {
  const { message, client } = ctx;
  const args = ctx.args();

  const unset = args[0] === "unset";
  const newStatus = args.join(" ");
  const key =
    kv.get(kvKeys.flags.devlockActive) ? kvKeys.botStatuses.devlock
    : COMMANDKIT_IS_DEV ? kvKeys.botStatuses.dev
    : kvKeys.botStatuses.normal;

  if (unset) {
    kv.delete(key);
  } else if (args.length) {
    kv.set(key, newStatus);
  }
  updateBotPresence(client);
  message.reply("Status updated");
};

export const metadata: CustomCommandMetadata = {
  aliases: ["us", "su"],
};
