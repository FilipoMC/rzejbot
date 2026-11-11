import { commandkit, COMMANDKIT_IS_DEV, Logger } from "commandkit";
import { Client } from "discord.js";
import { CustomLogger } from "./utils/logger/customLogger";

import "@/helper/apiHelper";
import "@/helper/employee";
import "@/helper/shifts";
import "@/helper/dev";

const client = new Client({
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "MessageContent",
    "GuildVoiceStates",
  ],
});

Logger.configure({ provider: new CustomLogger() });

const devPrefix = process.env.BOT_DEV_PREFIX ?? ">";
const prodPrefix = process.env.BOT_PREFIX ?? "!";

export const PREFIX = !COMMANDKIT_IS_DEV ? prodPrefix : devPrefix;
commandkit.setPrefixResolver(() => PREFIX);

export default client;
