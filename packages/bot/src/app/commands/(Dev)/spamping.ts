import kv from "@/utils/kv";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "sp",
};

export const message: MessageCommand = async (ctx) => {
  const { message, channel } = ctx;

  kv.set("abort", false);

  message.delete();

  const args = ctx.args();
  let count = parseInt(args[0] ?? "dziendobry") ?? 10;
  const content = args.slice(1).join(" ");

  const cb = () => {
    if (channel?.isSendable()) {
      channel.send(content);
    }
    count--;
    if (count > 0 && !kv.get("abort")) {
      setTimeout(cb, 1000);
    }
  };

  setTimeout(cb, 1000);
};
