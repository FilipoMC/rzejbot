import { addChangesModal } from "@/app/components/employee/addChangesModal";
import { employeeEditModal } from "@/app/components/employee/addEditModal";
import { displayEditEmpEmbed } from "@/app/components/employee/displayEditEmpEmbed";
import { ApiHelper } from "@/helper/apiHelper";
import {
  failedToExecute,
  commandError,
  commandSuccess,
  loading,
} from "@/utils/commandResponses";
import {
  EmployeeChangeType,
  EmployeePatch,
  EmployeeRanks,
} from "@shared/types/api";
import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";
import {
  ActionRow,
  Button,
  ChatInputCommand,
  CommandData,
  Container,
  Logger,
  OnModalKitSubmit,
  TextDisplay,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ButtonStyle,
  ColorResolvable,
  User,
  userMention,
} from "discord.js";
import z from "zod";
import channels from "@/config/channels";
import otherConfig from "@shared/config/config";
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
  const aRow = [
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
      <Button
        style={ButtonStyle.Secondary}
        customId="empAddChanges"
        onClick={async (itx, ctx) => {
          const modal = addChangesModal(interaction, addChangesModalHandler);
          if (!modal) {
            return;
          } else {
            await itx.showModal(modal);
          }
          ctx.dispose();
        }}
      >
        Dodaj opinię
      </Button>
    </ActionRow>,
  ];

  await interaction.editReply({
    content: `Proszę kliknąć guzik aby zacząć edycję pracownika (${userMention(emp.data.discordId)})`,
    embeds: [],
    components: aRow,
  });
};

export const empEditModalHandler: OnModalKitSubmit = async (
  interaction,
  ctx,
) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Wpisywanie do bazy danych i wysyłanie wiadomości",
  });
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

export const addChangesModalHandler: OnModalKitSubmit = async (
  interaction,
  ctx,
) => {
  const modalResponses = {
    user: interaction.fields.getSelectedUsers("user", true).at(0) as User,
    type: interaction.fields.getRadioGroup("type", true) as EmployeeChangeType,
    reason: interaction.fields.getTextInputValue("reason"),
    note: interaction.fields.getTextInputValue("note"),
    newRole: interaction.fields
      .getStringSelectValues("rank")
      .at(0) as EmployeeRanks,
  };

  if (!interaction.inCachedGuild()) {
    return;
  }

  const res = await ApiHelper.employee.changes.create(modalResponses.user.id, {
    issuer: {
      connect: {
        discordId: interaction.user.id,
      },
    },
    ...modalResponses,
    newRole: modalResponses.newRole,
  });

  if (res.status === "ok") {
    await commandSuccess({
      interactionOrMsg: interaction,
      description: `Pomyślnie utworzono opinię/uwagę na pracowniku ${res.data.employee.nameIC} (<@${res.data.employee.discordId}>)`,
    });
  } else if (res.status === "apiError" && res.errorStatus === "notFound") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: `Nie znaleziono pracownika (<@${modalResponses.user.id}>) w bazie danych`,
    });
    ctx.dispose();
    return;
  } else {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
    ctx.dispose();
    return;
  }

  if (["plus", "minus", "praise", "warn", "strike"].includes(res.data.type)) {
    const channel = await interaction.guild.channels.fetch(
      channels.opinie_uwagi,
    );
    if (!channel?.isSendable()) {
      await commandError({
        interactionOrMsg: interaction,
        description: `Wystąpił problem podczas wysyłania wiadomości na kanał, pomyślnie zapisano opinię w bazie danych. Należy manualnie wysłać wiadomość:\n\n`,
        ephemeral: true,
      });
      return;
    }

    const container = (
      <Container
        accentColor={
          otherConfig.changeType[res.data.type].color as ColorResolvable
        }
      >
        <TextDisplay>
          {[
            `## __**${otherConfig.changeType[res.data.type].prettyName}**__`,
            `>>> Kto wystawia: ${res.data.issuer.nameIC} <@${res.data.issuer.discordId}>`,
            `Komu wystawia: ${res.data.employee.nameIC} <@${res.data.employee.discordId}>`,
            `Uzasadnienie: ${res.data.reason}`,
            `Komentarz: ${res.data.note || ""}`,
          ].join("\n")}
        </TextDisplay>
      </Container>
    );
    await channel.send({
      components: [
        container,
        <ActionRow>
          <Button
            style={ButtonStyle.Link}
            url="https://files.catbox.moe/ivmvf6.png"
          >
            Odwołaj się
          </Button>
        </ActionRow>,
      ],
      flags: "IsComponentsV2",
    });
  }
  ctx.dispose();
  return;
};
