import prepareShiftBriefing, {
  PrepareShiftBriefingTaskData,
} from "@/app/tasks/prepareShiftBriefing";
import channels from "@/config/channels";
import other from "@/config/other";
import { getRandomImage, shiftEventName, websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { fetchChannelResolvable } from "@/utils/utilityFunctions";
import { createTask } from "@commandkit/tasks";
import { Button, ButtonKit, Logger, OnButtonKitClick } from "commandkit";
import {
  addMinutes,
  differenceInMilliseconds,
  minutesToMilliseconds,
} from "date-fns";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonStyle,
  Client,
  codeBlock,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  hyperlink,
  MessageFlags,
  spoiler,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";

interface SendShiftPlanSubmitEmbedProps {
  client: Client;
  shiftId: number;
  eventDesc: string;
}

/**
 * @returns
 * "not found" - The shift was not found / server returned 404
 * "error" - An error occured while communicating with the server
 * "approved" - The shift plan is already approved
 * undefined - no error, normal response
 */
export async function sendShiftPlanSubmitEmbed({
  client,
  eventDesc,
  shiftId,
}: SendShiftPlanSubmitEmbedProps): Promise<
  "not found" | "error" | "approved" | undefined
> {
  const shiftRes = await ApiHelper.shifts.getById(shiftId);

  if (shiftRes.status === "apiError" && shiftRes.errorStatus === "notFound") {
    return "not found";
  } else if (shiftRes.status !== "ok") {
    Logger.error(shiftRes);
    return "error";
  }

  const shift = shiftRes.data;

  if (shift.approved) {
    return "approved";
  }

  const content = [
    codeBlock("Informacje o zmianie"),
    `Numer zmiany - \`${shift.shiftNumber}\` ${spoiler("" + shift.id)}`,
    `Dzień zmiany - ${time(shift.plannedDate, TimestampStyles.ShortDate)}`,
    `Rozpoczęcie briefingu - ${time(shift.plannedDate, TimestampStyles.ShortTime)}`,
    `Rozpoczęcie zmiany - ${time(addMinutes(shift.plannedDate, shift.plannedBriefingDuration), TimestampStyles.ShortTime)}`,
    `Zakończenie zmiany - ${time(addMinutes(shift.plannedDate, shift.plannedBriefingDuration + shift.plannedDuration), TimestampStyles.ShortTime)}`,
    `Jednostka - \`${shift.unit}\``,
    "",
    `Kierownik zmiany - ${userMention(shift.host.discordId)}`,
    "",
    codeBlock("Opis eventu"),
    eventDesc,
    "",
    codeBlock("Cel zmiany"),
    shift.shiftGoal,
    "",
    codeBlock("Instrukcje i uwagi"),
    shift.notes,
  ].join("\n");

  const channel = await client.channels.fetch(channels.kierownicy_zmian);
  if (!channel?.isSendable()) {
    Logger.error({
      msg: "Nieprawidłowy kanał w configu",
      path: "channels.kierownicy_zmian",
    });
    return "error";
  }

  const onButtonClick: OnButtonKitClick = async (interaction, ctx) => {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await Promise.all([
      (async () => {
        const event = await interaction.guild.scheduledEvents
          .create({
            name: shiftEventName(shift.shiftNumber),
            scheduledStartTime: shift.plannedDate,
            scheduledEndTime: addMinutes(
              shift.plannedDate,
              shift.plannedBriefingDuration + shift.plannedDuration,
            ),
            entityType: GuildScheduledEventEntityType.Voice,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            channel: channels.zmianaVC.main,
            description: eventDesc,
            image: getRandomImage("shiftEvent"),
          })
          .catch(() => null);

        const absenceButtonCallback: OnButtonKitClick = async (
          buttonInteraction,
        ) => {
          await buttonInteraction.deferReply({
            flags: MessageFlags.Ephemeral,
          });
          await loading({
            interactionOrMsg: buttonInteraction,
            description: undefined,
          });
          const res = await ApiHelper.shifts.logEmployeeAbsence(shift.id, {
            employeeDiscordId: buttonInteraction.user.id,
          });

          if (res.status === "apiError" && res.errorStatus === "conflict") {
            await failedToExecute({
              interactionOrMsg: buttonInteraction,
              description: "Zgłosiłeś już nieobecność na tej zmianie",
            });
            return;
          } else if (res.status !== "ok") {
            await commandError({
              interactionOrMsg: buttonInteraction,
              description: "Wystąpił błąd podczas komunikacji z serwerem",
            });
            return;
          }

          await buttonInteraction.editReply({
            embeds: [],
            content: "Zgłoszono nieobecność",
            files: [new AttachmentBuilder(getRandomImage("declaredAbsence"))],
          });
        };

        const createActionRow = (disabled: boolean = false) =>
          new ActionRowBuilder<ButtonKit>().setComponents(
            <Button
              customId={`absence_${shift.id}`}
              style={ButtonStyle.Success}
              onClick={disabled ? undefined : absenceButtonCallback}
              disabled={disabled}
              options={{
                time: differenceInMilliseconds(shift.plannedDate, new Date()),
              }}
            >
              Zgłoś nieobecność
            </Button>,
          );

        const ogloszeniaBlokow = await fetchChannelResolvable(
          channels.ogloszeniaBlokow,
          client,
        );

        if (ogloszeniaBlokow?.isSendable()) {
          let content;
          if (event) {
            content = hyperlink(`Zmiana ${shift.shiftNumber}`, event.url);
          } else {
            content = hyperlink(
              `Zmiana ${shift.shiftNumber}`,
              websitePages.shiftPlan(shift.shiftNumber),
            );
          }
          const message = await ogloszeniaBlokow.send({
            content,
            components: [createActionRow()],
          });

          setTimeout(
            () => {
              message.edit({ components: [createActionRow(true)] });
            },
            differenceInMilliseconds(shift.plannedDate, new Date()) -
              minutesToMilliseconds(other.shifts.absenceAllowedUntil),
          );
        }
      })(),
      (async () => {
        const plansChannel = await fetchChannelResolvable(
          channels.plany,
          client,
        );

        if (plansChannel?.isSendable()) {
          await plansChannel.send({
            content: websitePages.shiftPlan(shift.shiftNumber),
          });
        }
      })(),
      ApiHelper.shifts.changeApproval(shiftId, true),
    ]);

    createTask({
      name: prepareShiftBriefing.name,
      data: {
        shiftIdentifier: { number: shift.shiftNumber },
        guildId: interaction.guildId,
      } satisfies PrepareShiftBriefingTaskData,
      schedule: shift.plannedDate,
    });

    await interaction.deferUpdate();
    interaction.message.edit({ components: [] });

    ctx.dispose();
  };

  const button = (
    <Button
      customId={`approve-shift-plan_${shift.id}`}
      style={ButtonStyle.Success}
      onClick={onButtonClick}
    >
      Zatwierdź
    </Button>
  );

  await channel.send({
    content,
    components: [new ActionRowBuilder<ButtonKit>().setComponents([button])],
  });
}
