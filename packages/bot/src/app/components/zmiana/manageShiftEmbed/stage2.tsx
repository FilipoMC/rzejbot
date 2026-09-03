import { ApiHelper } from "@/helper/apiHelper";
import { ShiftAPIResponse, ShiftReportAPIResponse } from "@shared/types/api";
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
import { getShiftManageEmbed } from ".";
import { createManageShiftEmbedStage3Components } from "./stage3";
import { createManageShiftEmbedSetStationsComponents } from "./substages/stations";
import { commandError } from "@/utils/commandResponses";

export function createManageShiftEmbedStage2Components(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
) {
  const startShiftButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const shiftReportRes = await ApiHelper.shifts.report.markShiftStart(
      shift.id,
    );

    if (shiftReportRes.status !== "ok") {
      Logger.error(shiftReportRes);
      await commandError({
        interactionOrMsg: interaction,
        description:
          shiftReportRes.error ?? "Błąd podczas komunikacji z serwerem.",
      });
      return;
    }

    const shiftReport = shiftReportRes.data;

    await interaction.deferUpdate();

    const newEmbed = getShiftManageEmbed(shift, shiftReport);

    await interaction.message.edit({
      embeds: [newEmbed],
      components: createManageShiftEmbedStage3Components(shift),
    });

    ctx.dispose();
  };

  const startShiftButton = (
    <Button
      customId={`start-shift_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={startShiftButtonCallback}
      options={{ once: true }}
    >
      Rozpocznij zmianę
    </Button>
  );

  const setCohostButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    if (interaction.replied) {
      console.log("hi");
      return;
    }
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      const selectedCohost = modalInteraction.fields
        .getSelectedUsers("cohost", true)
        .first();

      await modalInteraction.deferUpdate();

      const shiftReportRes = await ApiHelper.shifts.report.update(shift.id, {
        cohost: selectedCohost!.id,
      });

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

      await interaction.message.edit({
        embeds: [getShiftManageEmbed(shift, shiftReportRes.data)],
      });
      modalCtx.dispose();
    };

    const modal = (
      <Modal
        title="Wskaż przełożonego nadzorującego"
        customId={`cohost-modal_${shift.id}`}
        onSubmit={onModalSubmit}
        options={{ once: false }}
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

    await interaction.showModal(modal);

    ctx.dispose();

    setImmediate(() => {
      interaction.message.edit({
        components: createManageShiftEmbedStage2Components(shift, shiftReport),
      });
    });
  };

  const setCohostButton = (
    <Button
      customId={`set-cohost_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setCohostButtonCallback}
      options={{ once: true }}
    >
      Przełożony
    </Button>
  );

  const setStationsButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    await interaction.deferUpdate();

    await interaction.message.edit({
      components: createManageShiftEmbedSetStationsComponents(
        shift,
        shiftReport,
      ),
    });

    ctx.dispose();
  };

  const setStationsButton = (
    <Button
      customId={`goto-stations_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setStationsButtonCallback}
      options={{ once: true }}
    >
      Stanowiska
    </Button>
  );

  return [
    new ActionRowBuilder<ButtonKit>().addComponents(
      startShiftButton,
      setCohostButton,
      setStationsButton,
    ),
  ];
}
