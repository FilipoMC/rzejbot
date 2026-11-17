import { ApiHelper } from "@/helper/apiHelper";
import { commandError, commandSuccess } from "@/utils/commandResponses";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "rc",
  description: "Revalidate caches",
};

export const message: MessageCommand = async (ctx) => {
  if (ctx.message.channel.isSendable()) {
    ctx.message.channel.sendTyping();
  }

  const res = await ApiHelper.dev.revalidateCaches();

  if (res.status !== "ok") {
    commandError({ interactionOrMsg: ctx.message, description: undefined });
    return;
  }

  commandSuccess({
    interactionOrMsg: ctx.message,
    description: "Wyczyszczono cache na stronie.",
  });
};
