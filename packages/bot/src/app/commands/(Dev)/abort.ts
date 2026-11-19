import { kvKeys } from "@/config/other";
import { CustomCommandMetadata } from "@/types/commands";
import kv from "@/utils/kv";
import { rankGroups } from "@shared/config/ranks";
import { CommandData, MessageCommand } from "commandkit";

export const command: CommandData = {
  name: "abort",
};

export const message: MessageCommand = ({ message }) => {
  kv.set(kvKeys.flags.abortSpamPing, true);

  message.delete();
};

export const metadata: CustomCommandMetadata = {
  skipLocalMiddleware: true,
  permissions: {
    allowedRoles: [rankGroups["Kierownictwo Elektrowni"].id],
  },
  devSkipPermsCheck: true,
};
