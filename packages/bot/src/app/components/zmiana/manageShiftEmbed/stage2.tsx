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
} from "commandkit";
import { ActionRowBuilder, ButtonStyle, MessageFlags } from "discord.js";

import { createManageShiftEmbedStage3Components } from "./stage3";
import { createManageShiftEmbedSetStationsComponents } from "./substages/stations";
import { commandError } from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import {
  disposeShiftHandlers,
  getShiftManageEmbed,
  shiftManageEmbedComponentsFilter,
  registerButtonHandler,
  replaceModalHandler,
} from "./utils";

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
    const shiftReportRes = await deferAfter(
      interaction,
      ApiHelper.shifts.report.mark("shiftStart", shift.id),
    );

    if (shiftReportRes.status !== "ok") {
      Logger.error(shiftReportRes);
      await commandError({
        interactionOrMsg: interaction,
        description:
          shiftReportRes.error ?? "Błąd podczas komunikacji z serwerem.",
        useFollowUp: true,
      });
      return;
    }

    const shiftReport = shiftReportRes.data;

    const newEmbed = getShiftManageEmbed(shift, shiftReport, stations);

    disposeShiftHandlers(shift.id);

    await interaction.message.edit({
      embeds: [newEmbed],
      components: createManageShiftEmbedStage3Components(
        shift,
        shiftReport,
        stations,
      ),
    });

    ctx.dispose();
  };

  const startShiftButton = (
    <Button
      customId={`start-shift_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={startShiftButtonCallback}
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
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
        options={{ once: false, filter: shiftManageEmbedComponentsFilter }}
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
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
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
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
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
