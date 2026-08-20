import { CustomCommandMetadata } from "@type/commands";
import kv from "@/utils/kv";
import { updateBotPresence } from "@/utils/utilityFunctions";
import { CommandData, COMMANDKIT_IS_DEV, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "updatestatus",
  description: "Update the bot's status",
};

export const message: MessageCommand = async (ctx) => {
  const { message, client } = ctx;
  const args = ctx.args();

  const unset = args[0] === "unset";
  const newStatus = args.join(" ");
  const key =
    kv.get("devlock") ? "devlock-status"
    : COMMANDKIT_IS_DEV ? "dev-status"
    : "bot-status";

  if (unset) kv.delete(key);
  else if (args.length) kv.set(key, newStatus);
  updateBotPresence(client);
  message.reply("Status updated");
};

export const metadata: CustomCommandMetadata = {
  aliases: ["us", "su"],
};
