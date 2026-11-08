import channels from "@/config/channels";
import { websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import { commandError } from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import { ShiftAPIResponse } from "@shared/types/api";
import { Button, ButtonKit, Logger, OnButtonKitClick } from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  hyperlink,
  MessageFlags,
} from "discord.js";
import { createManageShiftEmbedStage2Components } from "./stage2";
import {
  createShiftManageEmbedComponentsFilter,
  getShiftManageEmbed,
} from "./utils";

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
      interaction.client.channels
        .fetch(channels.kierownicy_zmian)
        .then((channel) => {
          if (channel?.isSendable()) {
            channel.send(
              `**${shiftReport.shift.shiftNumber}** - ${hyperlink("podgląd raportu zmiany", websitePages.shiftReportPreview(shiftReport.shift.shiftNumber, shiftReport.previewAccessToken))}`,
            );
          } else {
            Logger.error({
              msg: "Nieprawidłowy kanał w configu",
              path: "channels.kierownicy_zmian",
            });
          }
        }),
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
