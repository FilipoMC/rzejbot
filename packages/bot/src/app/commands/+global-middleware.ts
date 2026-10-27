import { CustomCommandMetadata } from "@/types/commands";
import { MiddlewareContext, stopMiddlewares } from "commandkit";
import config from "@/config/config";
import { middlewareReply } from "@/utils/commandResponses";
import { middlewareCheckPerms } from "@/utils/middlewareUtils";
import kv from "@/utils/kv";
import { EmbedBuilder } from "discord.js";
import emoji from "@/config/emoji";

export function beforeExecute(ctx: MiddlewareContext) {
  const metadata = ctx.command.metadata as CustomCommandMetadata;
  const commandUser =
    ctx.isMessage() ? ctx.message.author : ctx.interaction.user;

  if (kv.get("devlock")) {
    const devlockMessage = kv.get("devlock-message") || "N/A";

    if (!config.devs.includes(commandUser.id)) {
      const embed = new EmbedBuilder()
        .setDescription(
          `${emoji.warning} Bot jest w trybie devlock. Tylko deweloperzy mogą używać komend.` +
            (devlockMessage ?
              `\n\nWiadomość od deweloperów: ${devlockMessage}`
            : ""),
        )
        .setFooter({
          text: "Aktualizacje sytuacji podawane są w statusie bota.",
        })
        .setColor("Blurple");

      middlewareReply(ctx, embed);

      stopMiddlewares();
    }
  }

  if (metadata.devSkipPermsCheck) {
    if (config.devs.includes(commandUser.id)) {
      return;
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
