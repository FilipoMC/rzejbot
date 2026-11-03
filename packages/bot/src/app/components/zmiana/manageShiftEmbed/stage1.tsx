import { ApiHelper } from "@/helper/apiHelper";
import { ShiftAPIResponse } from "@shared/types/api";
import { OnButtonKitClick, Button, ButtonKit, Logger } from "commandkit";
import { ActionRowBuilder, ButtonStyle, MessageFlags } from "discord.js";
import { createManageShiftEmbedStage2Components } from "./stage2";
import { commandError } from "@/utils/commandResponses";
import {
  getShiftManageEmbed,
  createShiftManageEmbedComponentsFilter,
} from "./utils";
import { deferAfter } from "@/utils/utilityFunctions";
import { websitePages } from "@/config/script";

export function createManageShiftEmbedStage1Components(
  shift: ShiftAPIResponse,
) {
  const startBriefingButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const shiftReportRes = await deferAfter(
      interaction,
      ApiHelper.shifts.report.markBriefingStart(shift.id),
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

    const newEmbed = getShiftManageEmbed(shift, shiftReport, []);

    await Promise.all([
      interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: `Link do edytowania raportu zmiany: ${websitePages.shiftReportEdit(shiftReport.shift.shiftNumber, shiftReport.accessToken)}`,
      }),
      interaction.user.send(
        `Link do edytowania raportu zmiany: ${websitePages.shiftReportEdit(shiftReport.shift.shiftNumber, shiftReport.accessToken)}`,
      ),
    ]);

    await interaction.message.edit({
      embeds: [newEmbed],
      components: createManageShiftEmbedStage2Components(
        shift,
        shiftReport,
        [],
      ),
    });

    ctx.dispose();
  };

  const startBriefingButton = (
    <Button
      customId={`start-briefing_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={startBriefingButtonCallback}
      options={{
        once: true,
        filter: createShiftManageEmbedComponentsFilter(shift.host.discordId),
      }}
    >
      Rozpocznij briefing
    </Button>
  );

  return [new ActionRowBuilder<ButtonKit>().addComponents(startBriefingButton)];
}
