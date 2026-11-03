import { ApiHelper } from "@/helper/apiHelper";
import {
  ShiftAPIResponse,
  ShiftLogStationsGetAPIResponse,
  ShiftReportAPIResponse,
} from "@shared/types/api";
import {
  OnButtonKitClick,
  Button,
  ButtonKit,
  Modal,
  UserSelectMenu,
  Label,
  Logger,
  OnModalKitSubmit,
  StringSelectMenu,
  StringSelectMenuOption,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  userMention,
} from "discord.js";

import { createManageShiftEmbedStage3Components } from "./stage3";
import { createManageShiftEmbedSetStationsComponents } from "./substages/stations";
import { commandError, commandSuccess } from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import {
  disposeShiftHandlers,
  getShiftManageEmbed,
  createShiftManageEmbedComponentsFilter,
  registerButtonHandler,
  replaceModalHandler,
  removeModalHandler,
} from "./utils";
import channels from "@/config/channels";
import { addMinutes } from "date-fns";

export function createManageShiftEmbedStage2Components(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
  stations: ShiftLogStationsGetAPIResponse,
) {
  disposeShiftHandlers(shift.id);

  const startShiftButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const shiftVC = await interaction.client.channels.fetch(
      channels.zmianaVC.main,
    );

    if (!shiftVC?.isVoiceBased()) {
      Logger.error({
        msg: "Invalid channel in config",
        path: "channels.zmianaVC.main",
      });
      await commandError({
        interactionOrMsg: interaction,
        description: undefined,
      });
      return;
    }

    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      const selectedMemberIds = modalInteraction.fields
        .getStringSelectValues("employees")
        .reduce((prev, memberUsername) => {
          const member = shiftVC.members.find(
            (v) => v.user.username === memberUsername,
          );
          if (member) {
            return [...prev, member.user.id];
          } else {
            return prev;
          }
        }, [] as string[]);

      selectedMemberIds.push(shift.host.discordId);

      const [shiftReportRes, presenceRes] = await deferAfter(
        modalInteraction,
        (async () => {
          const reportRes = await ApiHelper.shifts.report.mark(
            "shiftStart",
            shift.id,
          );

          const date =
            (
              reportRes.status === "ok" &&
              reportRes.data.briefingDuration !== null
            ) ?
              addMinutes(reportRes.data.date, reportRes.data.briefingDuration)
            : undefined;

          const presenceRes = await ApiHelper.shifts.logEmployeeInitialPresence(
            shift.id,
            { employees: selectedMemberIds, date },
          );

          return [reportRes, presenceRes];
        })(),
      );

      if (shiftReportRes.status !== "ok") {
        Logger.error(shiftReportRes);
        await commandError({
          interactionOrMsg: interaction,
          description:
            shiftReportRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (presenceRes.status !== "ok") {
        Logger.error(presenceRes);
        await commandError({
          interactionOrMsg: interaction,
          description:
            presenceRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (shiftReportRes.status !== "ok" || presenceRes.status !== "ok") {
        return;
      }

      const usersNotFound = presenceRes.data
        .filter((v) => !v.found)
        .map((v) =>
          v.employeeDiscordId ?
            userMention(v.employeeDiscordId)
          : v.employeeNameIC,
        )
        .join(", ");

      const shiftReport = shiftReportRes.data;

      const newEmbed = getShiftManageEmbed(shift, shiftReport, stations);

      disposeShiftHandlers(shift.id);

      if (usersNotFound.length > 0) {
        await commandSuccess({
          description:
            usersNotFound +
            " nie są w rejestrze pracowników. Pozostałe osoby zostały zapisane.",
          interactionOrMsg: modalInteraction,
          useFollowUp: true,
        });
      }

      modalCtx.dispose();

      setImmediate(() =>
        interaction.message.edit({
          embeds: [newEmbed],
          components: createManageShiftEmbedStage3Components(
            shift,
            shiftReport,
            stations,
          ),
        }),
      );
    };

    try {
      const modal = (
        <Modal
          title="Obecność na zmianie"
          customId={`presence-modal_${shift.id}`}
          onSubmit={onModalSubmit}
          options={{
            once: false,
            filter: createShiftManageEmbedComponentsFilter(
              shift.host.discordId,
            ),
          }}
        >
          <Label label="Przełożony">
            <StringSelectMenu
              minValues={1}
              maxValues={shiftVC.members.entries().toArray().length - 1}
              customId="employees"
            >
              {...shiftVC.members.reduce((prev, member) => {
                if (shift.host.discordId !== member.user.id) {
                  return [
                    ...prev,
                    <StringSelectMenuOption
                      label={member.nickname ?? member.user.username}
                      value={member.user.username}
                      default={true}
                    />,
                  ];
                } else {
                  return prev;
                }
              }, [] as StringSelectMenuOptionBuilder[])}
            </StringSelectMenu>
          </Label>
        </Modal>
      );

      replaceModalHandler(shift.id, modal);

      await interaction.showModal(modal);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      await commandError({
        interactionOrMsg: interaction,
        description: "Wystąpił błąd, prawdopodobnie nie ma nikogo na zmianie!",
      });
      removeModalHandler(shift.id);
    }

    ctx.dispose();

    setImmediate(() => {
      interaction.message.edit({
        components: createManageShiftEmbedStage2Components(
          shift,
          shiftReport,
          stations,
        ),
      });
    });
  };

  const startShiftButton = (
    <Button
      customId={`start-shift_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={startShiftButtonCallback}
      options={{
        once: true,
        filter: createShiftManageEmbedComponentsFilter(shift.host.discordId),
      }}
    >
      Rozpocznij zmianę
    </Button>
  );

  registerButtonHandler(shift.id, startShiftButton);

  const setCohostButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      const selectedCohost = modalInteraction.fields
        .getSelectedUsers("cohost", true)
        .first();

      const shiftReportRes = await deferAfter(
        modalInteraction,
        ApiHelper.shifts.report.update(shift.id, {
          cohost: selectedCohost!.id,
        }),
      );

      if (
        shiftReportRes.status === "apiError" &&
        shiftReportRes.errorStatus === "notFound"
      ) {
        await modalInteraction.followUp({
          content: "Ten użytkownik nie jest powiązany z żadnym pracownikiem.",
          flags: MessageFlags.Ephemeral,
        });

        return;
      } else if (shiftReportRes.status !== "ok") {
        Logger.error(shiftReportRes);
        await commandError({
          interactionOrMsg: modalInteraction,
          description:
            shiftReportRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
        return;
      }

      modalCtx.dispose();

      setImmediate(() => {
        interaction.message.edit({
          embeds: [getShiftManageEmbed(shift, shiftReportRes.data, stations)],
          components: createManageShiftEmbedStage2Components(
            shift,
            shiftReportRes.data,
            stations,
          ),
        });
      });
    };

    const modal = (
      <Modal
        title="Wskaż przełożonego nadzorującego"
        customId={`cohost-modal_${shift.id}`}
        onSubmit={onModalSubmit}
        options={{
          once: false,
          filter: createShiftManageEmbedComponentsFilter(shift.host.discordId),
        }}
      >
        <Label label="Przełożony">
          <UserSelectMenu
            customId="cohost"
            placeholder="Wybierz pracownika"
            minValues={1}
            maxValues={1}
            required
          />
        </Label>
      </Modal>
    );

    replaceModalHandler(shift.id, modal);

    await interaction.showModal(modal);

    ctx.dispose();

    setImmediate(() => {
      interaction.message.edit({
        components: createManageShiftEmbedStage2Components(
          shift,
          shiftReport,
          stations,
        ),
      });
    });
  };

  const setCohostButton = (
    <Button
      customId={`set-cohost_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setCohostButtonCallback}
      options={{
        once: true,
        filter: createShiftManageEmbedComponentsFilter(shift.host.discordId),
      }}
    >
      Przełożony
    </Button>
  );

  registerButtonHandler(shift.id, setCohostButton);

  const setStationsButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    await Promise.all([
      interaction.deferUpdate(),
      interaction.message.edit({
        components: createManageShiftEmbedSetStationsComponents(
          shift,
          shiftReport,
          stations,
          createManageShiftEmbedStage2Components,
        ),
      }),
    ]);

    ctx.dispose();
  };

  const setStationsButton = (
    <Button
      customId={`goto-stations_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setStationsButtonCallback}
      options={{
        once: true,
        filter: createShiftManageEmbedComponentsFilter(shift.host.discordId),
      }}
    >
      Stanowiska
    </Button>
  );

  registerButtonHandler(shift.id, setStationsButton);

  return [
    new ActionRowBuilder<ButtonKit>().addComponents(
      startShiftButton,
      setCohostButton,
      setStationsButton,
    ),
  ];
}
