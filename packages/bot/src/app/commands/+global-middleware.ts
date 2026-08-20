import { CustomCommandMetadata } from "@types/commands";
import { MiddlewareContext, stopMiddlewares } from "commandkit";
import config from "@/config/config.json";
import { middlewareReply } from "@/utils/commandResponses";
import { middlewareCheckPerms } from "@/utils/middlewareUtils";
import kv from "@/utils/kv";
import { EmbedBuilder } from "discord.js";
import emoji from "@/config/emoji.json";

export function beforeExecute(ctx: MiddlewareContext) {
  const metadata = ctx.command.metadata as CustomCommandMetadata;
  const commandUser =
    ctx.isMessage() ? ctx.message.author : ctx.interaction.user;

  if (kv.get("devlock")) {
    const devlockMessage = kv.get("devlock-message") || "N/A";

    if (!config.devs.includes(commandUser.id)) {
      const embed = new EmbedBuilder()
        .setDescription(
          `${emoji.warning} The bot is currently under developer lockdown` +
            (devlockMessage ?
              `\n\nMessage from developers: ${devlockMessage}`
            : ""),
        )
        .setFooter({ text: "Track this bot's status for updates" })
        .setColor("Blurple");

      middlewareReply(ctx, embed);

      stopMiddlewares();
    }
  }

  if (metadata.devonly) {
    if (!config.devs.includes(commandUser.id)) {
      middlewareReply(ctx);

      stopMiddlewares();
    }
  }

  if (metadata.permissions) {
    middlewareCheckPerms(ctx);
  }
}
