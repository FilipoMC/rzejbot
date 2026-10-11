import { employeeEditModal } from "@/app/components/employee/addEditModal";
import { displayEditEmpEmbed } from "@/app/components/employee/displayEditEmpEmbed";
import { ApiHelper } from "@/helper/apiHelper";
import {
  failedToExecute,
  commandError,
  commandSuccess,
} from "@/utils/commandResponses";
import { EmployeePatch } from "@shared/types/api";
import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";
import {
  ActionRow,
  Button,
  ChatInputCommand,
  CommandData,
  Logger,
  OnModalKitSubmit,
} from "commandkit";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  userMention,
} from "discord.js";
import z from "zod";

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
  const emp = await ApiHelper.employee.find(
    interaction.options.getUser("uzytkownik", true).id,
  );
  if (emp.status !== "ok") {
    if (emp.status === "apiError" && emp.errorStatus === "notFound") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description: emp.error,
      });
    } else {
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
    }
    return;
  }
  await interaction.reply({
    content: `Proszę kliknąć guzik aby zacząć edycję pracownika (${userMention(emp.data.discordId)})`,
    components: [
      <ActionRow>
        <Button
          style={ButtonStyle.Success}
          customId="empEditOneTime"
          onClick={async (itx, ctx) => {
            await itx.showModal(
              await employeeEditModal(empEditModalHandler, emp),
            );
            ctx.dispose();
            await itx.deleteReply();
          }}
        >
          Edytuj
        </Button>
      </ActionRow>,
    ],
    flags: MessageFlags.Ephemeral,
  });
};

export const empEditModalHandler: OnModalKitSubmit = async (
  interaction,
  ctx,
) => {
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

  const returnObj: Record<string, boolean> = {
    jadrowy: false,
    kierownikZmiany: false,
    pracownik: false,
    szkoleniowiec: false,
  } satisfies Required<NonNullable<EmployeePatch["qualification"]>["update"]>;
  for (const e of modalResponses.qual) {
    returnObj[e] = true;
  }

  const prismaRes = await ApiHelper.employee.update({
    discordId: modalResponses.user.id,
    nameIC: modalResponses.nameIC,
    rank: modalResponses.rank || "",
    robloxId: resParsed.data.data[0]?.id,
    qualification: {
      update: returnObj,
    },
  });

  if (prismaRes.status === "ok") {
    await commandSuccess({
      interactionOrMsg: interaction,
      description: `Pomyślnie zedytowano informacje o ${modalResponses.user} w bazie danych.`,
      ephemeral: true,
    });
  } else if (prismaRes.status === "badArgument" && prismaRes.error) {
    await commandError({
      interactionOrMsg: interaction,
      description:
        "Wystąpił błąd podczas weryfikacji podanych wartości:\n\n" +
        z.prettifyError(prismaRes.error),
    });
  } else if (
    prismaRes.status === "apiError" &&
    prismaRes.errorStatus === "notFound"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: prismaRes.error,
    });
  } else if (
    prismaRes.status === "apiError" &&
    prismaRes.errorStatus === "conflict"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: prismaRes.error,
    });
  } else {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
  }

  ctx.dispose();
  if (prismaRes.status !== "ok") {
    return;
  }

  await interaction.editReply({
    embeds: [displayEditEmpEmbed(modalResponses.user, prismaRes.data)],
    components: [],
  });
  return;
};
