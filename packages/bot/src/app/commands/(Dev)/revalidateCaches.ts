import { ApiHelper } from "@/helper/apiHelper";
import { commandError, success } from "@/utils/commandResponses";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "rc",
  description: "Revalidate caches",
};

export const message: MessageCommand = async (ctx) => {
  const res = await ApiHelper.dev.revalidateCaches();

  if (res.status !== "ok") {
    commandError({ interactionOrMsg: ctx.message, description: undefined });
    return;
  }

  success({
    interactionOrMsg: ctx.message,
    description: "Wyczyszczono cache na stronie.",
  });
};
