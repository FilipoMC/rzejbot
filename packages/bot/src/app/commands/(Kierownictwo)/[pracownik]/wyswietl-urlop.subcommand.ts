import { ApiHelper } from "@/helper/apiHelper";
import { commandError, failedToExecute } from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";

export const command: CommandData = {
  name: "wyswietl-urlop",
  description: "Lista urlopów pracownika",
  options: [
    {
      name: "pracownik",
      description: "pracownik dla którego należy wyświetlić urlopy",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const employee = interaction.options.getUser("pracownik", true);

  const res = await ApiHelper.employee.loa.listForEmployee(employee.id);

  if (res.status !== "ok") {
    if (res.status == "apiError" && res.errorStatus == "notFound") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: res.error,
        ephemeral: true,
      });
      return;
    } else {
      await commandError({
        interactionOrMsg: interaction,
        description: res.error?.toString(),
        ephemeral: true,
      });
    }
  }
};
