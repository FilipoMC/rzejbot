import { EmbedBuilder } from "discord.js";
import emoji from "@/config/emoji.json";

/** @config Configuration function, returns only embed  */
export function createNoPermissionEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${emoji.no} You are not permitted to run this!`)
    .setDescription("You are missing the required roles/permissions.")
    .setColor("DarkRed");
}

/** @config Configuration function, returns only embed  */
export function createCommandErrorEmbed(description?: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(
    `${emoji.warning} There was an error while executing this command${description ? `:\n\n${description}` : "."}`,
  );
}

/** @config Configuration function, returns only embed  */
export function createLoadingEmbed(description?: string) {
  return new EmbedBuilder()
    .setDescription(`${emoji.loading} ${description}`)
    .setColor("Blurple");
}

/** @config Configuration function, returns only embed  */
export function createSuccessEmbed(description?: string) {
  return new EmbedBuilder()
    .setDescription(
      `${emoji.yes} ${description || "Command executed successfully"}`,
    )
    .setColor("Green");
}

/** @config Configuration function, returns only embed  */
export function createFailEmbed(description?: string) {
  return new EmbedBuilder().setDescription(`${emoji.no} ${description}`);
}
