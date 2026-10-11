import {
  ChatInputCommand,
  CommandData,
  Logger,
  OnModalKitSubmit,
} from "commandkit";
import { ApplicationCommandOptionType, userMention } from "discord.js";
import { ApiHelper } from "@/helper/apiHelper";
import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";
import z from "zod";
import {
  commandError,
  failedToExecute,
  loading,
  commandSuccess,
} from "@/utils/commandResponses";
import { employeeAddModal } from "@/app/components/employee/addEditModal";

export const command: CommandData = {
  name: "dodaj",
  description: "dodaj pracownika",
  options: [
    {
      name: "uzytkownik",
      description: "osoba do dodania",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

const empAddmodalSubmitHadler: OnModalKitSubmit = async (interaction, ctx) => {
  await loading({ interactionOrMsg: interaction, description: undefined });

  const modalResponses = {
    user: interaction.fields.getSelectedUsers("user", true).at(0)!,
    nameIC: interaction.fields.getTextInputValue("nameIC"),
    robloxUser: interaction.fields.getTextInputValue("robloxName"),
    rank: interaction.fields.getStringSelectValues("rank")[0],
    qual: interaction.fields.getCheckboxGroup("qualification"),
  };

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    body: JSON.stringify({
      usernames: [modalResponses.robloxUser],
      excludeBannedUsers: true,
    }),
  });

  const resParsed = robloxUsersByUsernamesAPIResponseSchema.safeParse(
    await res.json(),
  );

  if (!resParsed.success) {
    Logger.error(z.treeifyError(resParsed.error));
    return;
  }

  if (!resParsed.data.data[0]) {
    Logger.debug(JSON.stringify(resParsed, null, 2));
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Podana nazwa użytkownika Roblox nie jest poprawna",
      ephemeral: true,
    });
    ctx.dispose();
    return;
  }
  // Logger.info([modalResponses.qual]);
  const returnObj: Record<string, boolean> = {};
  modalResponses.qual.map((e) => {
    returnObj[e] = true;
  });

  const prismaRes = await ApiHelper.employee.create({
    discordId: modalResponses.user.id,
    nameIC: modalResponses.nameIC,
    rank: modalResponses.rank || "",
    robloxId: resParsed.data.data[0]?.id,
    qualification: {
      create: returnObj,
    },
  });

  if (prismaRes.status === "ok") {
    await commandSuccess({
      interactionOrMsg: interaction,
      description: `Dodano nowego pracownika do bazy danych: ${prismaRes.data.nameIC} (${userMention(prismaRes.data.discordId)})`,
    });
  } else if (
    prismaRes.status === "apiError" &&
    prismaRes.errorStatus === "conflict"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: prismaRes.error,
    });
  } else if (prismaRes.status === "badArgument" && prismaRes.error) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description:
        "Wystąpił błąd podczas weryfikacji podanych wartości:\n\n" +
        z.prettifyError(prismaRes.error),
    });
  } else {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
  }

  ctx.dispose();
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await interaction.showModal(
    employeeAddModal(interaction, empAddmodalSubmitHadler),
  );
  return;
};
