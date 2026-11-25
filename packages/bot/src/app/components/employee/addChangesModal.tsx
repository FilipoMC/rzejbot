import {
  Container,
  Label,
  Modal,
  OnModalKitSubmit,
  RadioGroup,
  RadioGroupOption,
  TextDisplay,
  TextInput,
  UserSelectMenu,
} from "commandkit";
import {
  ChatInputCommandInteraction,
  ColorResolvable,
  TextInputStyle,
} from "discord.js";
import RzejEmployeeRanksStringSelect from "./rzejRanksStringSelect";
import { ApiHelper } from "@/helper/apiHelper";
import { ApiHelperReturnData } from "@/types/apiHelper";
import { EmployeeChangeType, EmployeeRanks } from "@shared/types/api";
import channels from "@/config/channels";
import {
  loading,
  failedToExecute,
  commandError,
  commandSuccess,
} from "@/utils/commandResponses";
import { sharedConfig } from "@shared/config/config";
import _ from "lodash";

export const addChangesModal = (
  interaction: ChatInputCommandInteraction,
  employee: ApiHelperReturnData<typeof ApiHelper.employee.find>,
  handler: OnModalKitSubmit,
) => {
  if (!interaction.inCachedGuild()) {
    return null;
  }
  const target =
    interaction.options.getMember("uzytkownik") ??
    interaction.options.getUser("uzytkownik", true);
  return (
    <Modal
      customId={`empAddChangesModal-${target.id}`}
      title="Dodaj opinię do pracownika"
      onSubmit={handler}
      options={{ once: true }}
    >
      <Label label="Użytkownik">
        <UserSelectMenu customId="user" defaultValues={employee.discordId} />
      </Label>
      <Label label="Typ">
        <RadioGroup customId="type" required>
          {Object.entries(sharedConfig.changeType).map(
            ([type, { prettyName }]) => (
              <RadioGroupOption label={prettyName} value={type} />
            ),
          )}
        </RadioGroup>
      </Label>
      <Label label="Uzasadnienie">
        <TextInput
          customId="reason"
          style={TextInputStyle.Paragraph}
          maxLength={500}
          required
        />
      </Label>
      <Label label="Komentarz" description="Dodatkowa informacja do opinii">
        <TextInput
          customId="note"
          style={TextInputStyle.Paragraph}
          maxLength={250}
        />
      </Label>
      <Label
        label="Nowa Rola"
        description="Rola którą pracownik dostanie po wysłaniu opinii (domyślnie ta same którą ma aktualnie)"
      >
        {RzejEmployeeRanksStringSelect({
          defaultRank: employee.employeeChanges[0]?.newRole,
        })}
      </Label>
    </Modal>
  );
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
        .at(0) as EmployeeRanks,
    };

    if (!interaction.inCachedGuild()) {
      return;
    }

    const empchangeCreateRes = await ApiHelper.employee.changes.create(
      employee.discordId,
      {
        issuer: { connect: { discordId: interaction.user.id } },
        ...modalResponses,
        newRole: modalResponses.newRole.replaceAll("_", " ") as EmployeeRanks,
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

      // "plus", "minus", "praise", "warn", "strike"
      switch (modalResponses.type) {
        case "demotion":
        case "promotion": {
          // const rolesToAdd = [
          //   ...new Set(
          //     getGroupsForRank(modalResponses.newRole).map((e) => e.role.id),
          //   ),
          // ];
          // rolesToAdd.push(
          //   ...new Set(
          //     getGroupsForRank(modalResponses.newRole).map((e) => e.group.id),
          //   ),
          // );

          // const rolesToRemoveLoop: string[] = [];
          // for (const [, role] of emmployeeDc.roles.cache) {
          //   rolesToRemoveLoop.push(
          //     ...getGroupsForRank(role.name).map((gr) => gr.role.id),
          //   );
          //   rolesToRemoveLoop.push(
          //     ...getGroupsForRank(role.name).map((gr) => gr.group.id),
          //   );
          // }

          // TODO: implement
          // await manageEmployeeRoles(
          //   employee,
          //   empchangeCreateRes?.data.employee,
          // );

          // for (const committee of employee.committees) {
          //   rolesToRemoveLoop.push(
          //     ...new Set(getGroupsForRank(committee).map((e) => e.role.id)),
          //   );
          //   rolesToRemoveLoop.push(
          //     ...new Set(getGroupsForRank(committee).map((e) => e.group.id)),
          //   );
          // }
          // const rolesToRemove = [...new Set(rolesToRemoveLoop)];
          // Logger.debug(["R+", rolesToAdd].join("\n"));
          // Logger.debug(["R-", rolesToRemove].join("\n"));
          // const final = {
          //   add: rolesToAdd.filter((e) => !rolesToRemove.includes(e)),
          //   rm: rolesToRemove.filter((e) => !rolesToAdd.includes(e)),
          // };
          // Logger.debug({
          //   add: final.add.map((e) => `<@&${e}>`),
          //   rm: final.rm.map((e) => `<@&${e}>`),
          // });
          // await emmployeeDc.roles.remove(final.rm);
          // await emmployeeDc.roles.add(final.add);
          break;
        }
        // case "suspension":  does this even do anything really
        case "termination":
        case "resignation":
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
