import { CustomCommandMetadata } from "@/types/commands";
import { createFailEmbed } from "@/utils/embeds";
import kv from "@/utils/kv";
import { updateBotPresence } from "@/utils/utilityFunctions";
import { CommandData, Logger, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "devlock",
  description: "Lockdown the bot to only developers",
};

export const message: MessageCommand = async (ctx) => {
  const { message, client } = ctx;
  const args = ctx.args();

  if (args.length && !["on", "off", "unset"].includes(args[0]!)) {
    await message.reply({
      embeds: [
        createFailEmbed('Valid first argument is "on", "off" or "unset"'),
      ],
    });
    return;
  }

  const action =
    args.length === 0 ? "TOGGLE"
    : args[0] === "on" ? "ON"
    : args[0] === "off" ? "OFF"
    : "UNSET";

  const currentState = Boolean(kv.get("devlock") ?? false);
  const nextState =
    action === "ON" ? true
    : action === "OFF" ? false
    : action === "TOGGLE" ? !currentState
    : currentState;
  const devlockMessage = args.slice(1).join(" ") || null;

  if (devlockMessage && action !== "UNSET") {
    kv.set("devlock-message", devlockMessage);
  } else if (action === "UNSET") {
    kv.delete("devlock-message");
  }

  Logger.log({
    msg: "Devlock status update",
    state: nextState,
    stateStatus: currentState === nextState ? `UNCHANGED` : `UPDATED`,
    message: kv.get("devlock-message"),
    messageStatus:
      action === "UNSET" ? "UNSET"
      : devlockMessage ? `UPDATED`
      : `UNCHANGED`,
    actionBy: message.author.id,
  });

  if (action !== "UNSET") kv.set("devlock", nextState);
  updateBotPresence(client);

  message.reply(`Devlock status is now: **${nextState ? "ON" : "OFF"}**`);
};

export const metadata: CustomCommandMetadata = {
  aliases: ["dl", "devlock"],
};
