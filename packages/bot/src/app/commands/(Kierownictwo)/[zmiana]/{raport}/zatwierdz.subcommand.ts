import { ApiHelper } from "@/helper/apiHelper";
import { CustomCommandMetadata } from "@/types/commands";
import {
  commandError,
  commandSuccess,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";
import channels from "@/config/channels";
import { websitePages } from "@/config/script";

export const command: CommandData = {
  name: "zatwierdz",
  description: "Zatwierdź plan zmiany.",
  options: [
    {
      name: "zmiana",
      description: "Numer zmiany w formacie XXX/YY",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Pobieranie zmiany...",
  });
  const shiftNumber = interaction.options.getString("zmiana", true);

  const shiftRes = await ApiHelper.shifts.getByShiftNumber(shiftNumber);

  if (shiftRes.status === "badArgument") {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: shiftRes.error ?? "",
    });
    return;
  } else if (
    shiftRes.status === "apiError" &&
    shiftRes.errorStatus === "notFound"
  ) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Podana zmiana nie istnieje.",
    });
    return;
  } else if (shiftRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas komunikacji z serwerem.",
    });
    return;
  }

  await loading({
    interactionOrMsg: interaction,
    description: "Aktualizowanie stanu zmiany...",
  });

  const shift = shiftRes.data;

  const reportRes = await ApiHelper.shifts.report.changeApproval(
    shift.id,
    true,
  );

  if (reportRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas aktualizowania stanu zmiany.",
    });
    return;
  }

  await loading({
    interactionOrMsg: interaction,
    description: "Wysyłanie stosownych wiadomości...",
  });

  const channel = await interaction.client.channels.fetch(channels.raporty);

  const shiftReportUrl = websitePages.shiftReport(shift.shiftNumber);

  try {
    if (channel?.isSendable()) {
      await channel.send(shiftReportUrl);
    } else {
      throw "tak";
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    await commandError({
      interactionOrMsg: interaction,
      description: `Wysłanie raportu nie powiodło się, lecz jest on zatwierdzony; proszę wysłać go ręcznie: ${shiftReportUrl}`,
    });
    return;
  }

  await commandSuccess({
    interactionOrMsg: interaction,
    description: undefined,
  });
};
