import { websitePages } from "@/config/script";
import { ApiHelper } from "@/helper/apiHelper";
import {
  commandError,
  commandSuccess,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";

export const command: CommandData = {
  name: "zresetuj-token",
  description: "Zresetuj token do edytowania raportu zmiany.",
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
    description: "Resetowanie tokenu...",
  });

  const shift = shiftRes.data;

  const reportRes = await ApiHelper.shifts.report.resetAccessToken(shift.id);

  if (reportRes.status !== "ok") {
    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas resetowania tokenu.",
    });
    return;
  }

  await loading({
    interactionOrMsg: interaction,
    description: "Wysyłanie stosownych wiadomości...",
  });

  const shiftReportUrl = websitePages.shiftReportEdit(
    shift.shiftNumber,
    reportRes.data.accessToken,
  );

  await commandSuccess({
    interactionOrMsg: interaction,
    description: `Zresetowano token do raportu zmiany, nowy link: ${shiftReportUrl}`,
  });
};
