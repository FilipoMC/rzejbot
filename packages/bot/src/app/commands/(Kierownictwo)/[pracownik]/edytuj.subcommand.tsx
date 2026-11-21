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
  Button,
  ButtonKit,
  ChatInputCommand,
  CommandData,
  Container,
  Label,
  Logger,
  Modal,
  ModalKit,
  OnButtonKitClick,
  OnModalKitSubmit,
  StringSelectMenu,
  StringSelectMenuOption,
  TextDisplay,
} from "commandkit";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonInteraction,
  ButtonStyle,
  ColorResolvable,
  ComponentType,
  userMention,
} from "discord.js";
import z from "zod";
import channels from "@/config/channels";
import { sharedConfig } from "@shared/config/config";
import {
  committeesGrouped,
  getGroupsForRank,
  rankGroups,
} from "@shared/config/ranks";
import { CommandkitBullshitHandler } from "@/utils/classes/bullshitHandler";
import { ApiHelperReturnData } from "@/types/apiHelper";
import _ from "lodash";

const HandleModalBullshit = new CommandkitBullshitHandler<ModalKit>();
const HandleButtonBullshit = new CommandkitBullshitHandler<ButtonKit>();

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

  const committeeButtons: ButtonKit[] = [];
  for (const group in committeesGrouped) {
    const groupCustomID = group.replaceAll(" ", "_");

    const buttonHandlerFunc: OnButtonKitClick = async (
      buttonItx,
      buttonCtx,
    ) => {
      const modal = (
        <Modal
          title="Pracownik Edytuj | Role Dodatkowe"
          customId={`empeditmodal-${buttonItx.user.id}`}
          options={{ once: false }}
          onSubmit={editCommitteesHandler(employee.data)}
        >
          {committeesGrouped[group as keyof typeof committeesGrouped].map(
            (k) => {
              const rankGroupBeingIndexed =
                rankGroups[k.value as keyof typeof rankGroups];
              return (
                <Label label={k.value}>
                  <StringSelectMenu
                    customId={`${k.value.replaceAll(" ", "_")}`}
                    maxValues={
                      k.allowMultiChoice ?
                        rankGroupBeingIndexed.ranks.length
                      : 1
                    }
                  >
                    {rankGroupBeingIndexed.ranks.map((r) => {
                      Logger.debug({
                        r,
                        b: employee.data.committees,
                        c: (employee.data.committees as string[]).includes(r),
                      });
                      return (
                        <StringSelectMenuOption
                          label={r}
                          value={r.replaceAll(" ", "_")}
                          default={(
                            employee.data.committees as string[]
                          ).includes(r)}
                        />
                      );
                    })}
                  </StringSelectMenu>
                </Label>
              );
            },
          )}
        </Modal>
      );
      await showModal({ itx: buttonItx, ctx: buttonCtx }, modal);
    };
    const button = (
      <Button
        customId={groupCustomID}
        style={ButtonStyle.Secondary}
        onClick={buttonHandlerFunc}
      >
        {group}
      </Button>
    );
    committeeButtons.push(button);
  }

  async function showModal(
    { itx, ctx }: { itx: ButtonInteraction; ctx: ButtonKit },
    modal: ModalKit,
  ) {
    HandleModalBullshit.replaceOldCollector(itx.user.id, modal);
    await itx.showModal(modal);
    await itx.deleteReply();
    ctx.dispose();
  }

  const empEditButton = (
    <Button
      style={ButtonStyle.Success}
      customId={`empEditOneTime-${interaction.user.id}`}
      onClick={async (itx, ctx) => {
        await showModal(
          { itx, ctx },
          await employeeEditModal(empEditModalHandler, employee),
        );
      }}
    >
      Edytuj
    </Button>
  );

  const addChangesButton = (
    <Button
      customId={`empeditpromotiondemotion-${interaction.user.id}`}
      style={ButtonStyle.Primary}
      onClick={async (itx, ctx) =>
        await showModal(
          { itx, ctx },
          addChangesModal(
            interaction,
            employee.data,
            addChangesModalHandler(employee.data),
          ),
        )
      }
    >
      Zmiany w rangach pracownika
    </Button>
  );
  // const aRow = new ActionRowBuilder<ButtonKit>().addComponents([
  //   empEditButton,
  //   addChangesButton,
  //   // TODO: fix
  //   committeeButtons[0],
  // ]);
  const aRow: Array<ButtonKit[]> = [[], [], [], [], []];
  committeeButtons.unshift(empEditButton, addChangesButton);
  committeeButtons.forEach((button, i) => {
    return aRow[Math.floor((i + 1) / 5)]!.push(button);
  });
  if (aRow.length > 5) {
    Logger.error(
      [import.meta.filename, "ActionRow ma więcej niż 5 wierszy"].join("\n"),
    );
    throw "nie";
  }
  HandleButtonBullshit.replaceOldCollector(
    interaction.user.id,
    committeeButtons,
  );

  const components = aRow.reduce(
    (prev: Array<ActionRowBuilder<ButtonKit>>, row) => {
      if (row.length === 0) {
        return prev;
      }
      return [...prev, new ActionRowBuilder<ButtonKit>().setComponents(row)];
    },
    [],
  );
  await interaction.editReply({
    content: `Proszę kliknąć guzik aby zacząć edycję pracownika (${userMention(employee.data.discordId)})`,
    embeds: [],
    components,
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
    return;
  }

  if (!resParsed.data.data[0]) {
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
              modalResponses.note ? `Komentarz: ${modalResponses.note}` : "",
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
          for (const committee of modalResponses.committees.map((e) =>
            e.replaceAll("_", " "),
          )) {
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
            rolesToRemoveLoop.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
            );
            rolesToRemoveLoop.push(
              ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
            );
          }
          const rolesToRemove = [...new Set(rolesToRemoveLoop)];
          // Logger.debug(["R+", rolesToAdd].join("\n"));
          // Logger.debug(["R-", rolesToRemove].join("\n"));
          const final = {
            add: rolesToAdd.filter((e) => !rolesToRemove.includes(e)),
            rm: rolesToRemove.filter((e) => !rolesToAdd.includes(e)),
          };
          // Logger.debug({
          //   add: final.add.map((e) => `<@&${e}>`),
          //   rm: final.rm.map((e) => `<@&${e}>`),
          // });
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

export const editCommitteesHandler =
  (
    employee: ApiHelperReturnData<typeof ApiHelper.employee.update>,
  ): OnModalKitSubmit =>
  async (interaction, ctx) => {
    const com = interaction.fields.fields
      .map((modalData) => {
        if (modalData.type === ComponentType.StringSelect) {
          return modalData.values.map((r) => r.replaceAll("_", " "));
        } else {
          throw "How?";
        }
      })
      .flat();

    const res = await ApiHelper.employee.update(employee.discordId, {
      committees: com as OtherEmployeeRanks[],
    });
    if (res.status !== "ok") {
      await commandError({
        interactionOrMsg: interaction,
        description: "Wystąpił błąd podczas zapisywania zmian w bazie danych",
      });
    }

    const rolesToAdd: string[] = [];
    for (const committee of com) {
      rolesToAdd.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
      );
      rolesToAdd.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
      );
    }

    const rolesToRemoveLoop: string[] = [];
    for (const committee of employee.committees) {
      rolesToRemoveLoop.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
      );
      rolesToRemoveLoop.push(
        ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
      );
    }
    const rolesToRemove = [...new Set(rolesToRemoveLoop)];
    // Logger.debug(["R+", rolesToAdd].join("\n"));
    // Logger.debug(["R-", rolesToRemove].join("\n"));
    const final = {
      add: rolesToAdd.filter((e) => !rolesToRemove.includes(e)),
      rm: rolesToRemove.filter((e) => !rolesToAdd.includes(e)),
    };
    // Logger.debug({
    //   add: final.add.map((e) => `<@&${e}>`),
    //   rm: final.rm.map((e) => `<@&${e}>`),
    // });

    const employeeDc = await interaction.guild?.members.fetch(
      employee.discordId,
    );
    if (!employeeDc) {
      await commandError({
        interactionOrMsg: interaction,
        description:
          "Nawet deweloperzy nie wiedzą jak to jest możliwe, spróbuj ponownie.",
      });
      throw "Jakim cudem employeeDc jest undefined???\n" + import.meta.filename;
    }
    await employeeDc.roles.remove(final.rm);
    await employeeDc.roles.add(final.add);
    await commandSuccess({
      interactionOrMsg: interaction,
      description: "Pomyślnie zmieniono komisje pracownika",
    });
    ctx.dispose();
    return;
  };
