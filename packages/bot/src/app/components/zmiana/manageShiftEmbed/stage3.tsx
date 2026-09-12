import { ApiHelper } from "@/helper/apiHelper";
import {
  ShiftAPIResponse,
  ShiftLogStationsGetAPIResponse,
  ShiftReportAPIResponse,
} from "@shared/types/api";
import { OnButtonKitClick, Button, ButtonKit, Logger } from "commandkit";
import { ActionRowBuilder, ButtonStyle } from "discord.js";
import {
  getShiftManageEmbed,
  registerButtonHandler,
  shiftManageEmbedComponentsFilter,
} from "./utils";
import { commandError } from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import { createManageShiftEmbedSetStationsComponents } from "./substages/stations";

export function createManageShiftEmbedStage3Components(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
  stations: ShiftLogStationsGetAPIResponse,
) {
  const endShiftButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    const shiftReportRes = await deferAfter(
      interaction,
      ApiHelper.shifts.report.mark("shiftEnd", shift.id),
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

    await interaction.message.edit({
      embeds: [newEmbed],
      components: [],
    });

    ctx.dispose();
  };

  const endShiftButton = (
    <Button
      customId={`end-shift_${shift.id}`}
      style={ButtonStyle.Danger}
      onClick={endShiftButtonCallback}
      options={{ once: true }}
    >
      Zakończ zmianę
    </Button>
  );

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
          createManageShiftEmbedStage3Components,
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
      endShiftButton,
      setStationsButton,
    ),
  ];
}
