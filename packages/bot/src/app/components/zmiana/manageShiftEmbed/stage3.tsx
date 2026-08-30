import { ApiHelper, apiHelperUnsafe } from "@/helper/apiHelper";
import { ShiftAPIResponse } from "@shared/types/api";
import { OnButtonKitClick, Button, ButtonKit } from "commandkit";
import { ActionRowBuilder, ButtonStyle } from "discord.js";
import { getShiftManageEmbed } from ".";

export function createManageShiftEmbedStage3Components(
  shift: ShiftAPIResponse,
) {
  const endShiftButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    await interaction.deferUpdate();

    const shiftReport = await apiHelperUnsafe(
      ApiHelper.shifts.report.markShiftEnd,
      shift.id,
    );

    const newEmbed = getShiftManageEmbed(shift, shiftReport);

    await interaction.message.edit({ embeds: [newEmbed], components: [] });

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

  return [new ActionRowBuilder<ButtonKit>().addComponents(endShiftButton)];
}
