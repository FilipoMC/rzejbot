import {
  commandError,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";
import { ApiHelper } from "@/helper/apiHelper";
import { displayEditEmpEmbed } from "@/app/components/employee/displayEditEmpEmbed";

export const command: CommandData = {
  name: "wyswietl",
  description: "Wyświetl informacje o danym pracowniku",
  options: [
    {
      name: "uzytkownik",
      description: "Osoba do wyświetlania informacji",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Ładowanie karty pracownika",
    ephemeral: true,
  });

  const user = interaction.options.getUser("uzytkownik", true);
  if (!("displayName" in user)) {
    return;
  }
  const employee = await ApiHelper.employee.find(user.id);
  if (employee.status !== "ok") {
    if (employee.status === "apiError" && employee.errorStatus === "notFound") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: employee.errorStatus,
      });
    } else if (employee.status === "badArgument") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description:
          "Wybrany użytkownik nie jest ani nie był pracownikiem ŻEJ.",
      });
    } else {
      await commandError({
        interactionOrMsg: interaction,
        description: "Wystąpił błąd podczas komunikacji z serwerem.",
      });
    }
    return;
  }

  await interaction.editReply({
    embeds: [displayEditEmpEmbed(user, employee.data)],
  });
  return;
};
