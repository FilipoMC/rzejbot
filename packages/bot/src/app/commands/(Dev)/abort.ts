import { kvKeys } from "@/config/other";
import kv from "@/utils/kv";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "abort",
};

export const message: MessageCommand = ({ message }) => {
  kv.set(kvKeys.flags.abortSpamPing, true);

  message.delete();
};
