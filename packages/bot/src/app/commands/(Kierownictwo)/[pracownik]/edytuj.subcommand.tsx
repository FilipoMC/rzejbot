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
  AllEmployeeRanks,
  EmployeeChangeType,
  EmployeePatch,
  OtherEmployeeRanks,
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
  userMention,
} from "discord.js";
import z from "zod";
import channels from "@/config/channels";
import { sharedConfig } from "@shared/config/config";
import { getGroupsForRank } from "@shared/config/ranks";
import { CommandkitBullshitHandler } from "@/utils/classes/bullshitHandler";
import { ApiHelperReturnData } from "@/types/apiHelper";
import _, { keyBy } from "lodash";

const HandleModalBullshit = new CommandkitBullshitHandler();

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
  const employee = await ApiHelper.employee.find(
    interaction.options.getUser("uzytkownik", true).id,
  );
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
  const aRow = [
    <ActionRow>
      <Button
        style={ButtonStyle.Success}
        customId="empEditOneTime"
        onClick={async (itx, ctx) => {
          const modal = await employeeEditModal(empEditModalHandler, employee);
          HandleModalBullshit.replaceOldCollector(interaction.user.id, modal);
          await itx.showModal(modal);
          await itx.deleteReply();
          ctx.dispose();
        }}
      >
        Edytuj
      </Button>
      <Button
        style={ButtonStyle.Secondary}
        customId="empAddChanges"
        onClick={async (itx, ctx) => {
          const modal = addChangesModal(
            interaction,
            employee.data,
            addChangesModalHandler(employee.data),
          );
          if (!modal) {
            return;
          } else {
            HandleModalBullshit.replaceOldCollector(interaction.user.id, modal);
            await itx.showModal(modal);
          }
          await interaction.deleteReply();
          ctx.dispose();
        }}
      >
        Dodaj opinię
      </Button>
    </ActionRow>,
  ];

  await interaction.editReply({
    content: `Proszę kliknąć guzik aby zacząć edycję pracownika (${userMention(employee.data.discordId)})`,
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

  const prismaRes = await ApiHelper.employee.update(modalResponses.user.id, {
    discordId: modalResponses.user.id,
    nameIC: modalResponses.nameIC,
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

export const addChangesModalHandler =
  (
    employee: ApiHelperReturnData<typeof ApiHelper.employee.find>,
  ): OnModalKitSubmit =>
  async (interaction, ctx) => {
    await loading({
      interactionOrMsg: interaction,
      description: undefined,
    });
    const modalResponses = {
      employeeId: interaction.customId.split("-")[1] as string,
      type: interaction.fields.getRadioGroup(
        "type",
        true,
      ) as EmployeeChangeType,
      reason: interaction.fields.getTextInputValue("reason"),
      note: interaction.fields.getTextInputValue("note"),
      newRole: interaction.fields
        .getStringSelectValues("rank")
        .at(0) as AllEmployeeRanks,
      committees: interaction.fields.getStringSelectValues(
        "committees",
      ) as OtherEmployeeRanks[],
    };

    if (!interaction.inCachedGuild()) {
      return;
    }

    const oldRole = employee.employeeChanges.data[0]?.newRole;
    const isRankChanging = oldRole !== modalResponses.newRole;
    const isCommitteeChanging = !_.isEqual(
      employee.committees,
      modalResponses.committees,
    );

    let empchangeCreateRes = null;
    if (
      isRankChanging ||
      ["plus", "minus", "praise", "warn", "strike"].includes(
        modalResponses.type,
      )
    ) {
      empchangeCreateRes = await ApiHelper.employee.changes.create(
        employee.discordId,
        {
          issuer: { connect: { discordId: interaction.user.id } },
          ...modalResponses,
        },
      );
      // #region
      if (
        empchangeCreateRes.status === "apiError" &&
        empchangeCreateRes.errorStatus === "notFound"
      ) {
        await failedToExecute({
          interactionOrMsg: interaction,
          description: `Nie znaleziono pracownika w bazie danych`,
        });
        ctx.dispose();
        return;
      } else if (empchangeCreateRes.status !== "ok") {
        await commandError({
          interactionOrMsg: interaction,
          description: undefined,
        });
        ctx.dispose();
        return;
      }
      // #endregion
    }
    if (isCommitteeChanging) {
      const empUpdateRes = await ApiHelper.employee.update(employee.discordId, {
        committees: modalResponses.committees.map((e) =>
          e.replaceAll("_", " "),
        ) as OtherEmployeeRanks[],
      });
      if (empUpdateRes.status !== "ok") {
        await commandError({
          interactionOrMsg: interaction,
          description:
            "Wystąpił błąd podczas aktualizacji danych pracownika w bazie danych, proszę o kontakt z deweloperami w celu sprawdzenia co poszło nie tak",
        });
        ctx.dispose();
        return;
      }
    }

    if (
      ["plus", "minus", "praise", "warn", "strike"].includes(
        modalResponses.type,
      )
    ) {
      const { employee, issuer } = empchangeCreateRes!.data;
      // #region Sending empchange
      const channel = await interaction.guild.channels.fetch(
        channels.opinie_uwagi,
      );
      if (!channel?.isSendable()) {
        await commandError({
          interactionOrMsg: interaction,
          description: `Wystąpił problem podczas wysyłania wiadomości na kanał, pomyślnie zapisano opinię w bazie danych. Należy manualnie wysłać wiadomość:\n\n`,
          ephemeral: true,
        });
        ctx.dispose();
        return;
      }

      const container = (
        <Container
          accentColor={
            sharedConfig.changeType[modalResponses.type]
              .color as ColorResolvable
          }
        >
          <TextDisplay>
            {[
              `## __**${sharedConfig.changeType[modalResponses.type].prettyName}**__`,
              `>>> Kto wystawia: ${issuer.nameIC} <@${issuer.discordId}>`,
              `Komu wystawia: ${employee.nameIC} <@${employee.discordId}>`,
              `Uzasadnienie: ${modalResponses.reason}`,
              `Komentarz: ${modalResponses.note || ""}`,
            ].join("\n")}
          </TextDisplay>
        </Container>
      );
      await channel.send({
        components: [container],
        flags: "IsComponentsV2",
      });
    } else {
      // #region Role management
      const emmployeeDc = await interaction.guild.members.fetch(
        employee.discordId,
      );
      // "plus", "minus", "praise", "warn", "strike"
      switch (modalResponses.type) {
        case "demotion":
        case "promotion": {
          const rolesToAdd = [
            ...new Set(
              getGroupsForRank(modalResponses.newRole).map((e) => e.role.id),
            ),
          ];
          rolesToAdd.push(
            ...new Set(
              getGroupsForRank(modalResponses.newRole).map((e) => e.group.id),
            ),
          );
          for (const committee of modalResponses.committees) {
            rolesToAdd.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
            );
            rolesToAdd.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
            );
          }

          const rolesToRemoveLoop: string[] = [];
          for (const [, role] of emmployeeDc.roles.cache) {
            rolesToRemoveLoop.push(
              ...getGroupsForRank(role.name).map((gr) => gr.role.id),
            );
            rolesToRemoveLoop.push(
              ...getGroupsForRank(role.name).map((gr) => gr.group.id),
            );
          }
          for (const committee of employee.committees) {
            rolesToAdd.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
            );
            rolesToAdd.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
            );
          }
          const rolesToRemove = [...new Set(rolesToRemoveLoop)];
          Logger.debug(["R+", rolesToAdd].join("\n"));
          Logger.debug(["R-", rolesToRemove].join("\n"));
          const final = {
            add: rolesToAdd.filter((e) => !rolesToRemove.includes(e)),
            rm: rolesToRemove.filter((e) => !rolesToAdd.includes(e)),
          };
          Logger.debug(
            JSON.stringify(
              final,
              ([k, v]) => {
                return `<@&${v}>`;
              },
              2,
            ),
          );
          await emmployeeDc.roles.remove(final.rm);
          await emmployeeDc.roles.add(final.add);
          break;
        }
        // case "suspension":  does this even do anything really
        case "termination":
        default:
          break;
      }
    }
    // #endregion
    await commandSuccess({
      interactionOrMsg: interaction,
      description: `Pomyślnie utworzono opinię/uwagę na pracowniku ${employee.nameIC} (<@${employee.discordId}>)`,
      useFollowUp: false,
    });
    ctx.dispose();
    return;
  };
