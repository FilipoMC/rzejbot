import kv from "@/utils/kv";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "abort",
};

export const message: MessageCommand = ({ message }) => {
  kv.set("abort", true);

  message.delete();
};
