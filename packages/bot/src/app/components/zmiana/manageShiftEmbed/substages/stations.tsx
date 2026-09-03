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
  TextInput,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  TextInputStyle,
} from "discord.js";
import { getShiftManageEmbed } from "..";
import { createManageShiftEmbedStage2Components } from "../stage2";

export function createManageShiftEmbedSetStationsComponents(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
) {
  const backButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    await interaction.deferUpdate();

    await interaction.message.edit({
      components: createManageShiftEmbedStage2Components(shift, shiftReport),
    });

    ctx.dispose();
  };

  const backButton = (
    <Button
      customId={`back-stations_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={backButtonCallback}
      options={{ once: true }}
    >
      « Powrót
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
      const selectedCohost = modalInteraction.fields
        .getSelectedUsers("cohost", true)
        .first();

      const shiftReportRes = await ApiHelper.shifts.report.update(shift.id, {
        cohost: selectedCohost!.id,
      });

      let newEmbed;

      if (
        shiftReportRes.status === "apiError" &&
        shiftReportRes.errorStatus === "notFound"
      ) {
        newEmbed = getShiftManageEmbed(shift, shiftReport);
        await modalInteraction.reply({
          content: "Ten użytkownik nie jest powiązany z żadnym pracownikiem.",
          flags: MessageFlags.Ephemeral,
        });
      } else if (shiftReportRes.status !== "ok") {
        Logger.error(shiftReportRes);
        throw shiftReportRes;
      }

      if (shiftReportRes.status === "ok") {
        newEmbed = getShiftManageEmbed(shift, shiftReportRes.data);
        shiftReport = shiftReportRes.data;
        await modalInteraction.deferUpdate();
      }

      await interaction.message.edit({
        embeds: [newEmbed!], // All invariants either set newEmbed or throw
        components: createManageShiftEmbedStage2Components(shift, shiftReport),
      });

      modalCtx.dispose();
    };

    await interaction.message.edit({
      embeds: [getShiftManageEmbed(shift, shiftReport)],
      components: createManageShiftEmbedStage2Components(shift, shiftReport),
    });

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

    interaction.showModal(modal);

    ctx.dispose();
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
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
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
        await modalInteraction.reply({
          content: "Ten użytkownik nie jest powiązany z żadnym pracownikiem.",
          flags: MessageFlags.Ephemeral,
        });
      } else if (shiftReportRes.status !== "ok") {
        Logger.error(shiftReportRes);
        throw shiftReportRes;
      }

      if (shiftReportRes.status === "ok") {
        shiftReport = shiftReportRes.data;
        await modalInteraction.deferUpdate();
      }

      const newEmbed = getShiftManageEmbed(shift, shiftReport);

      await interaction.message.edit({
        embeds: [newEmbed], // All invariants either set newEmbed or throw
        components: createManageShiftEmbedStage2Components(shift, shiftReport),
      });

      modalCtx.dispose();
    };

    await interaction.message.edit({
      embeds: [getShiftManageEmbed(shift, shiftReport)],
      components: createManageShiftEmbedStage2Components(shift, shiftReport),
    });

    const modal = (
      <Modal
        title="Przydziel stanowiska pracownikom"
        customId={`stations-modal_${shift.id}`}
        onSubmit={onModalSubmit}
        options={{ once: false }}
      >
        <Label label="Kontrola Mocy">
          <UserSelectMenu
            customId="kontrola_mocy"
            placeholder="Wybierz pracownika"
            maxValues={1}
          />
        </Label>
        <Label label="Kontrola Turbin (MCR)">
          <UserSelectMenu
            customId="kontrola_turbin_mcr"
            placeholder="Wybierz pracownika"
            maxValues={1}
          />
        </Label>
        <Label label="Dodatkowe stanowiska">
          <TextInput
            customId="dodatkowe-stanowiska"
            style={TextInputStyle.Paragraph}
            placeholder="Dodatkowe stanowiska w formacie&#10;stanowisko - rp name pracownika&#10;stanowisko - rp name pracownika"
          />
        </Label>
      </Modal>
    );

    interaction.showModal(modal);

    ctx.dispose();
  };

  const setStationsButton = (
    <Button
      customId={`set-stations_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setStationsButtonCallback}
      options={{ once: true }}
    >
      Stanowiska
    </Button>
  );

  return [
    new ActionRowBuilder<ButtonKit>().addComponents(
      backButton,
      setCohostButton,
      setStationsButton,
    ),
  ];
}
