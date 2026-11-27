import {
  addChangesModal,
  addChangesModalHandler,
} from "@/app/components/employee/addChangesModal";
import { employeeEditModal } from "@/app/components/employee/addEditModal";
import {
  displayEditEmpEmbed,
  empEditModalHandler,
} from "@/app/components/employee/displayEditEmpEmbed";
import { ApiHelper } from "@/helper/apiHelper";
import {
  failedToExecute,
  commandError,
  loading,
} from "@/utils/commandResponses";
import {
  Button,
  ButtonKit,
  ChatInputCommand,
  CommandData,
  Label,
  Logger,
  Modal,
  ModalKit,
  OnButtonKitClick,
  StringSelectMenu,
  StringSelectMenuOption,
} from "commandkit";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
} from "discord.js";
import { allRanks, committeesGrouped, rankGroups } from "@shared/config/ranks";
import { CommandkitBullshitHandler } from "@/utils/classes/bullshitHandler";
import _ from "lodash";
import { editCommitteesHandler } from "@/app/components/employee/editCommittees";
import { CacheIt } from "@/utils/classes/cache";
import { EmployeeAPIResponse } from "@shared/types/api";

const HandleModalBullshit = new CommandkitBullshitHandler<ModalKit>();
const HandleButtonBullshit = new CommandkitBullshitHandler<ButtonKit>();
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

  // #region dynamic btns
  const committeeButtons: ButtonKit[] = [];
  for (const group in committeesGrouped) {
    const groupCustomID = group.replaceAll(" ", "_");

    const buttonHandlerFunc: OnButtonKitClick = async (buttonItx) => {
      const modal = (
        <Modal
          title="Pracownik Edytuj | Role Dodatkowe"
          customId={`empeditmodal-${buttonItx.user.id}-${groupCustomID}`}
          options={{ once: false }}
          onSubmit={editCommitteesHandler(
            empEditCache.get(employee.data.discordId) ?? employee.data,
            interaction,
          )}
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
                      // Logger.debug({
                      //   r,
                      //   b: empEditCache.get(employee.data.discordId) ?? employee.data.committees,
                      //   c: (empEditCache.get(employee.data.discordId) ?? employee.data.committees as string[]).includes(r),
                      // });
                      return (
                        <StringSelectMenuOption
                          label={r}
                          value={r.replaceAll(" ", "_")}
                          default={(
                            empEditCache.get(employee.data.discordId)
                              ?.committees ??
                            (employee.data.committees as string[])
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
      HandleModalBullshit.replaceOldCollector(buttonItx.user.id, modal);
      await buttonItx.showModal(modal);
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
  // #endregion

  const empEditButton = (
    <Button
      style={ButtonStyle.Success}
      customId={`empEditOneTime-${interaction.user.id}`}
      onClick={async (itx) => {
        const modal = await employeeEditModal(
          empEditModalHandler(interaction),
          empEditCache.get(employee.data.discordId) ?? employee.data,
        );
        HandleModalBullshit.replaceOldCollector(interaction.user.id, modal);
        await itx.showModal(modal);
      }}
    >
      Edytuj
    </Button>
  );

  const addChangesButton = (
    <Button
      customId={`empeditpromotiondemotion-${interaction.user.id}`}
      style={ButtonStyle.Primary}
      onClick={async (itx) => {
        const modal = addChangesModal(
          interaction,
          empEditCache.get(employee.data.discordId) ?? employee.data,
          addChangesModalHandler(
            empEditCache.get(employee.data.discordId) ?? employee.data,
          ),
        );
        HandleModalBullshit.replaceOldCollector(interaction.user.id, modal);
        await itx.showModal(modal);
      }}
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
    return aRow[Math.floor(i / 5)]!.push(button);
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
    embeds: [
      displayEditEmpEmbed(
        target,
        empEditCache.get(employee.data.discordId) ?? employee.data,
        interaction.guild?.roles.cache.get(
          allRanks[employee.data.employeeChanges[0]!.newRole],
        )?.colors.primaryColor ?? "Blurple",
      ),
    ],
    components,
  });
};
