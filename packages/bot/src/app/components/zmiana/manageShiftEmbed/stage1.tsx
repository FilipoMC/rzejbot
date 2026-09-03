import { ApiHelper, apiHelperUnsafe } from "@/helper/apiHelper";
import { ShiftAPIResponse } from "@shared/types/api";
import { OnButtonKitClick, Button, ButtonKit } from "commandkit";
import { ActionRowBuilder, ButtonStyle } from "discord.js";
import { getShiftManageEmbed } from ".";
import { createManageShiftEmbedStage2Components } from "./stage2";

export function createManageShiftEmbedStage1Components(
  shift: ShiftAPIResponse,
) {
  const startBriefingButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const shiftReport = await apiHelperUnsafe(
      ApiHelper.shifts.report.markBriefingStart,
      shift.id,
    );

    const newEmbed = getShiftManageEmbed(shift, shiftReport);

    await Promise.all([
      interaction.message.edit({
        embeds: [newEmbed],
        components: createManageShiftEmbedStage2Components(shift, shiftReport),
      }),
      interaction.deferUpdate(),
    ]);

    ctx.dispose();
  };

  const startBriefingButton = (
    <Button
      customId={`start-briefing_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={startBriefingButtonCallback}
      options={{ once: true }}
    >
      Rozpocznij briefing
    </Button>
  );

  return [new ActionRowBuilder<ButtonKit>().addComponents(startBriefingButton)];
}
