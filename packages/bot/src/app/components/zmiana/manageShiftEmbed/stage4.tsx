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
  Logger,
  Modal,
  Label,
  TextInput,
  OnModalKitSubmit,
} from "commandkit";
import {
  ActionRowBuilder,
  ButtonStyle,
  GuildScheduledEventStatus,
  TextInputStyle,
  userMention,
} from "discord.js";
import {
  getShiftManageEmbed,
  registerButtonHandler,
  replaceModalHandler,
  shiftManageEmbedComponentsFilter,
} from "./utils";
import {
  commandError,
  commandSuccess,
  failedToExecute,
} from "@/utils/commandResponses";
import { deferAfter } from "@/utils/utilityFunctions";
import { createManageShiftEmbedSetStationsComponents } from "./substages/stations";
import { shiftEventName } from "@/config/script";
import { nameICSchema } from "@shared/zod/employeeSchemas";
import z from "zod";
import { Tuple } from "@shared/types/utils";

export function createManageShiftEmbedStage4Components(
  shift: ShiftAPIResponse,
  shiftReport: ShiftReportAPIResponse,
  stations: ShiftLogStationsGetAPIResponse,
) {
  const endDebriefingButtonCallback: OnButtonKitClick = async (
    interaction,
    ctx,
  ) => {
    const newEmbed = getShiftManageEmbed(shift, shiftReport, stations, false);

    await interaction.message.edit({
      embeds: [newEmbed],
      components: [],
    });

    ctx.dispose();
  };

  const endDebriefingButton = (
    <Button
      customId={`end-debriefing_${shift.id}`}
      style={ButtonStyle.Danger}
      onClick={endDebriefingButtonCallback}
      options={{ once: true }}
    >
      Zakończ debriefing
    </Button>
  );

  registerButtonHandler(shift.id, endDebriefingButton);

  const setDosesButtonCallback: OnButtonKitClick = async (interaction, ctx) => {
    const onModalSubmit: OnModalKitSubmit = async (
      modalInteraction,
      modalCtx,
    ) => {
      const entries = modalInteraction.fields.getTextInputValue("input");

      const [logRes, newStationsRes] = await deferAfter(
        modalInteraction,
        (async () => {
          return [
            await ApiHelper.shifts.report.logDoses(
              shift.id,
              entries
                .split("\n")
                .filter((v) => {
                  const split = v.split(" - ");

                  return (
                    split.length === 2 &&
                    nameICSchema.safeParse(split[0]).success &&
                    z
                      .string()
                      .regex(/\d; \d:\d/)
                      .safeParse(split[1]).success
                  );
                })
                .map((v) => {
                  const [employee, comb] = v.split(" - ") as Tuple<string, 2>;

                  const [dose, timeComb] = comb.split("; ") as Tuple<string, 2>;

                  const timeTuple = timeComb.split(":") as Tuple<string, 2>;

                  const [hours, minutes] = timeTuple.map((v) =>
                    parseInt(v),
                  ) as Tuple<number, 2>;

                  return {
                    employee,
                    dose: parseInt(dose) ?? null,
                    time:
                      !isNaN(hours) && !isNaN(minutes) ?
                        hours * 60 + minutes
                      : null,
                  };
                }),
            ),
            await ApiHelper.shifts.stations.get(shift.id),
          ];
        })(),
      );

      if (logRes.status !== "ok") {
        Logger.error(logRes);
        await failedToExecute({
          interactionOrMsg: interaction,
          description: logRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (newStationsRes.status !== "ok") {
        Logger.error(newStationsRes);
        await commandError({
          interactionOrMsg: interaction,
          description:
            newStationsRes.error ?? "Błąd podczas komunikacji z serwerem.",
          useFollowUp: true,
        });
      }

      if (logRes.status !== "ok" || newStationsRes.status !== "ok") {
        return;
      }

      const newStations = newStationsRes.data;

      const usersNotFound = logRes.data
        .filter((v) => !v.found)
        .map((v) =>
          v.employeeDiscordId ?
            userMention(v.employeeDiscordId)
          : v.employeeNameIC,
        )
        .join(", ");

      if (usersNotFound.length > 0) {
        await commandSuccess({
          description:
            usersNotFound +
            " nie są w rejestrze pracowników. Pozostałe dawki zostały zanotowane.",
          interactionOrMsg: modalInteraction,
          useFollowUp: true,
        });
      }

      modalCtx.dispose();

      await interaction.message.edit({
        embeds: [getShiftManageEmbed(shift, shiftReport, newStations)],
        components: createManageShiftEmbedStage4Components(
          shift,
          shiftReport,
          stations,
        ),
      });
    };

    const modal = (
      <Modal
        title="Zapisz przyjęte dawki"
        customId={`shift-doses-modal_${shift.id}`}
        onSubmit={onModalSubmit}
        options={{ once: false, filter: shiftManageEmbedComponentsFilter }}
      >
        <Label label="Dawki">
          <TextInput
            customId="input"
            placeholder="rp name pracownika - dawka[µSv]; h:min[czas ekspozycji]"
            style={TextInputStyle.Paragraph}
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
        components: createManageShiftEmbedStage4Components(
          shift,
          shiftReport,
          stations,
        ),
      });
    });
  };

  const setDosesButton = (
    <Button
      customId={`shift-doses_${shift.id}`}
      style={ButtonStyle.Secondary}
      onClick={setDosesButtonCallback}
      options={{ once: true, filter: shiftManageEmbedComponentsFilter }}
    >
      Dawki
    </Button>
  );

  registerButtonHandler(shift.id, setDosesButton);

  return [
    new ActionRowBuilder<ButtonKit>().addComponents(
      endDebriefingButton,
      setDosesButton,
    ),
  ];
}
