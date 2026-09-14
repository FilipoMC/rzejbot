import { EmbedBuilder } from "discord.js";
import emoji from "@/config/emoji.json";

/** @config Configuration function, returns only embed  */
export function createNoPermissionEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${emoji.no} Brak uprawnień!`)
    .setDescription("Nie masz wystarczajacych uprawnień aby użyć tego.")
    .setColor("DarkRed");
}

/** @config Configuration function, returns only embed  */
export function createCommandErrorEmbed(description?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setDescription(
      `${emoji.warning} Wystąpił błąd, spróbuj ponownie lub skontaktuj się z deweloperem${description ? `:\n\n${description}` : "."}`,
    )
    .setColor("DarkRed");
}

/** @config Configuration function, returns only embed  */
export function createLoadingEmbed(description?: string) {
  return new EmbedBuilder()
    .setDescription(
      `${emoji.loading} ${description ?? "Ładowanie Informacji..."}`,
    )
    .setColor("Blurple");
}

/** @config Configuration function, returns only embed  */
export function createSuccessEmbed(description?: string) {
  return new EmbedBuilder()
    .setDescription(
      `${emoji.yes} ${description || "Proces wykonywania komendy został zakończony z wynikiem pozytywnym."}`,
    )
    .setColor("Green");
}

/** @config Configuration function, returns only embed  */
export function createFailEmbed(description: string) {
  return new EmbedBuilder()
    .setDescription(`${emoji.no} ${description}`)
    .setColor("DarkRed");
}
