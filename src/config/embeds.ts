import { EmbedBuilder } from "discord.js"
import config from "@/config/config.json"

/** @config Configuration function, returns only embed  */
export function noPermission(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${config.icons.x} You are not permitted to run this!`)
    .setDescription("You are missing the required roles/permissions.")
    .setColor("DarkRed")
}

/** @config Configuration function, returns only embed  */
export function commandError(description?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setDescription(`${config.icons.warning} There was an error while executing this command${description ? `:\n\n${description}` : "."}`)
}

/** @config Configuration function, returns only embed  */
export function loading(description?: string) {
  return new EmbedBuilder()
    .setDescription(`${config.icons.loading} ${description}`)
    .setColor("Blurple");
}

/** @config Configuration function, returns only embed  */
export function success(description?: string) {
  return new EmbedBuilder()
    .setDescription(`${config.icons.checkmark} ${description || "Command executed successfully"}`,)
    .setColor("Green");
}

/** @config Configuration function, returns only embed  */
export function fail(description?: string) {
  return new EmbedBuilder()
    .setDescription(`${config.icons.x} ${description}`)
}
