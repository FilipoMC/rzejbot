import config from "@/config/config";
import emoji from "@/config/emoji";
import { kvKeys } from "@/config/other";
import { CustomCommandMetadata } from "@/types/commands";
import { middlewareReply } from "@/utils/commandResponses";
import kv from "@/utils/kv";
import { middlewareCheckPerms } from "@/utils/middlewareUtils";
import { MiddlewareContext, stopMiddlewares } from "commandkit";
import { EmbedBuilder } from "discord.js";

export function beforeExecute(ctx: MiddlewareContext) {
  const metadata = ctx.command.metadata as CustomCommandMetadata;
  const commandUser =
    ctx.isMessage() ? ctx.message.author : ctx.interaction.user;
  const devlockStatus = kv.get(kvKeys.flags.devlockActive);
  if (devlockStatus) {
    const devlockMessage = kv.get(kvKeys.messages.devlock) || "N/A";

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

  if (metadata.devSkipPermsCheck || devlockStatus) {
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

  // Anty-starszyński infrastruktura
  // if (
  //   ctx?.interaction?.user?.id === "1467509269208498359" ||
  //   ctx?.message?.author?.id === "1467509269208498359"
  // ) {
  //   failedToExecute({
  //     interactionOrMsg: ctx.interaction ?? ctx.message,
  //     description: "Masz blacklista na rzejbocie, serdeczne gratulacje",
  //   });
  //   stopMiddlewares();
  // }
}
