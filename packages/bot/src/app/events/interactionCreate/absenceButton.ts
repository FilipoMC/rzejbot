import { eventHandledAbsenceButton } from "@/app/commands/(Kierownictwo)/[zmiana]/{plan}/zatwierdz.subcommand";
import channels from "@/config/channels";
import other from "@/config/other";
import { getRandomImage, shiftEventName } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { fetchChannelResolvable } from "@/utils/utilityFunctions";
import { EventHandler } from "commandkit";
import { addMinutes } from "date-fns";
import { AttachmentBuilder } from "discord.js";

const handler: EventHandler<"interactionCreate"> = async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }

  const splitCustomId = interaction.customId.split("_");

  if (splitCustomId[0] !== eventHandledAbsenceButton.customId.prefix) {
    return;
  }

  await loading({ interactionOrMsg: interaction, description: undefined });

  const parseRes =
    eventHandledAbsenceButton.customId.validator.safeParse(splitCustomId);

  if (!parseRes.success) {
    await commandError({
      interactionOrMsg: interaction,
      description: "Niepoprawny format customId",
    });
    return;
  }

  const [, shiftId] = parseRes.data;

  const shiftRes = await ApiHelper.shifts.getById(shiftId);

  if (shiftRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: undefined,
    });
    return;
  }

  const shift = shiftRes.data;

  if (
    Date.now() >
    addMinutes(shift.plannedDate, -other.shifts.absenceAllowedUntil).getTime()
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Nie możesz już zgłosić nieobecności na tej zmianie",
    });
    return;
  }

  await loading({
    interactionOrMsg: interaction,
    description: undefined,
  });
  const res = await ApiHelper.shifts.logEmployeeAbsence(shift.id, {
    employeeDiscordId: interaction.user.id,
  });

  if (res.status === "apiError" && res.errorStatus === "conflict") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Zgłosiłeś już nieobecność na tej zmianie",
    });
    return;
  } else if (res.status === "apiError" && res.errorStatus === "notFound") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description:
        "Nie jesteś zarejestrowanym pracownikiem ~~lub zmiana nie istnieje ale to tam raczej mało prawdopodobne~~",
    });
    return;
  } else if (res.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas komunikacji z serwerem",
    });
    return;
  }

  await interaction.editReply({
    embeds: [],
    content: "Zgłoszono nieobecność",
    files: [new AttachmentBuilder(getRandomImage("declaredAbsence"))],
  });

  const channel = await fetchChannelResolvable(
    channels.kierownicy_zmian,
    interaction.client,
  );

  if (!channel?.isSendable()) {
    return;
  }

  const message = await channel.messages
    .fetch()
    .then((messages) =>
      messages.find(
        (msg) =>
          msg.content.startsWith(shiftEventName(shift.shiftNumber)) &&
          msg.author.id === interaction.client.user.id &&
          msg.editable,
      ),
    );

  if (message?.content.includes(interaction.user.id)) {
    return;
  }

  if (message?.editable) {
    await message.edit(message.content + `\n${interaction.user}`);
    return;
  }

  channel.send(
    `${shiftEventName(shift.shiftNumber)}\n# ZGŁOSZONE NIEOBECNOŚCI na zmianie ${shift.shiftNumber}\n\n${interaction.user}`,
  );
};

export default handler;
