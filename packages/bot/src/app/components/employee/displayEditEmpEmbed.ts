import { EmployeeAPIResponse } from "@shared/types/api";
import { EmbedBuilder, User } from "discord.js";
import emoji from "@/config/emoji.json";

export function displayEditEmpEmbed(user: User, employee: EmployeeAPIResponse) {
  const decideEmoji = (bool: boolean) => (bool ? emoji.yes : emoji.no);
  return new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(`### ${employee.rank} ${employee.nameIC}`)
    .addFields([
      // { name: "Statystyki", value: [`Obecności na zmianach: ${employee.data.}`].join("\n") },
      {
        name: "Kwalifikacje/Uprawnienia",
        value: [
          `Pracownik: ${decideEmoji(employee.qualification.pracownik)}`,
          `Jądrowy: ${decideEmoji(employee.qualification.jadrowy)}`,
          `Kierownik Zmiany: ${decideEmoji(employee.qualification.kierownikZmiany)}`,
          `Szkoleniowiec: ${decideEmoji(employee.qualification.szkoleniowiec)}`,
        ].join("\n"),
      },
    ]);
}
