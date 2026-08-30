import { ApiHelper, apiHelperUnsafe } from "@/helper/apiHelper";
import { ShiftAPIResponse } from "@shared/types/api";
import {
  OnButtonKitClick,
  Button,
  ButtonKit,
  Modal,
  UserSelectMenu,
  Label,
  ModalKit,
  Logger,
  OnModalKitSubmit,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { getShiftManageEmbed } from ".";
import { createManageShiftEmbedStage3Components } from "./stage3";

export function createManageShiftEmbedStage2Components(
  shift: ShiftAPIResponse,
) {
  const startShiftButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    await interaction.deferUpdate();

    const shiftReport = await apiHelperUnsafe(
      ApiHelper.shifts.report.markShiftStart,
      shift.id,
    );

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
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      console.log("aaa");
      const selectedCohost = modalInteraction.fields
        .getSelectedUsers("cohost", true)
        .first();

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
        throw shiftReportRes;
      }

      const newEmbed = getShiftManageEmbed(shift, shiftReportRes.data);

      await interaction.message.edit({
        embeds: [newEmbed],
        components: createManageShiftEmbedStage2Components(shift),
      });

      modalCtx.dispose();
    };

    const modal = (
      <Modal
        title="Wskaż przełożonego nadzorującego"
        customId={`cohost-modal_${shift.id}`}
        onSubmit={onModalSubmit}
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

    interaction.showModal(modal);

    ctx.dispose();
  };

  const setCohostButton = (
    <Button
      customId={`set-cohost_${shift.id}`}
      style={ButtonStyle.Primary}
      onClick={setCohostButtonCallback}
      options={{ once: true }}
    >
      Przełożony
    </Button>
  );

  return [
    new ActionRowBuilder<ButtonKit>().addComponents(
      startShiftButton,
      setCohostButton,
    ),
  ];
}
