import { displayEditEmpEmbed } from "@/app/components/employee/displayEditEmpEmbed";
import { ApiHelper } from "@/helper/apiHelper";
import {
  failedToExecute,
  commandError,
  loading,
} from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";
import { allRanks } from "@shared/config/ranks";
import _ from "lodash";
import { CacheIt } from "@/utils/classes/cache";
import { EmployeeAPIResponse } from "@shared/types/api";

export const empEditCache = new CacheIt<string, EmployeeAPIResponse>();

export const command: CommandData = {
  name: "edytuj",
  description: "Edytuj danego pracowniku",
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
    description: undefined,
  });
  const target = interaction.options.getUser("uzytkownik", true);
  const employee = await ApiHelper.employee.find(target.id);
  if (employee.status !== "ok") {
    if (employee.status === "apiError" && employee.errorStatus === "notFound") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: employee.error,
      });
    } else {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
    }
    return;
  }
  empEditCache.set(employee.data.discordId, employee.data, 10 * 60 * 1000);

  await displayEditEmpEmbed(
    target,
    empEditCache.get(employee.data.discordId) ?? employee.data,
    interaction.guild?.roles.cache.get(
      allRanks[employee.data.employeeChanges[0]!.newRole],
    )?.colors.primaryColor ?? "Blurple",
    interaction,
  );
  return;
};
