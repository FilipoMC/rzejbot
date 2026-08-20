import { commandkit, COMMANDKIT_IS_DEV, Logger } from "commandkit";
import { Client } from "discord.js";
import { CustomLogger } from "./utils/logger/customLogger";

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

Logger.configure({ provider: new CustomLogger() });

export const PREFIX = !COMMANDKIT_IS_DEV ? "!" : ">";
commandkit.setPrefixResolver(() => PREFIX);

export default client;
