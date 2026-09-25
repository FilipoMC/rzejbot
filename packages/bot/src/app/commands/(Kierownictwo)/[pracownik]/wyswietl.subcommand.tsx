import {
  commandError,
  failedToExecute,
  loading,
} from "@/utils/commandResponses";
import { ActionRow, Button, ChatInputCommand, CommandData } from "commandkit";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import emoji from "@/config/emoji.json";
import { ApiHelper } from "@/helper/apiHelper";

export const command: CommandData = {
  name: "wyswietl",
  description: "Wyświetl informacje o danym pracowniku",
  options: [
    {
      name: "uzytkownik",
      description: "Osoba do wyświetlania informacji",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await loading({
    interactionOrMsg: interaction,
    description: "Ładowanie karty pracownika",
    ephemeral: true,
  });
  const user = interaction.options.getUser("uzytkownik", true);

  if (!("displayName" in user)) {
    return;
  }
  const employee = await ApiHelper.employee.find(user.id);
  if (employee.status !== "ok") {
    if (employee.status === "apiError") {
      if (employee.errorStatus === "notFound") {
        await failedToExecute({
          interactionOrMsg: interaction,
          description: employee.errorStatus,
        });
        return;
      }
    } else if (employee.status === "badArgument") {
      await failedToExecute({
        interactionOrMsg: interaction,
        description:
          "Wybrany użytkownik nie jest ani nie był pracownikiem ŻEJ.",
      });
    }

    await commandError({
      interactionOrMsg: interaction,
      description: "Wystąpił błąd podczas komunikacji z serwerem.",
    });
    return;
  }

  const decideEmoji = (bool: boolean) => (bool ? emoji.yes : emoji.no);
  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(`### ${employee.data.rank} ${employee.data.nameIC}`)
    .addFields([
      // { name: "Statystyki", value: [`Obecności na zmianach: ${employee.data.}`].join("\n") },
      {
        name: "Kwalifikacje/Uprawnienia",
        value: [
          `Pracownik: ${decideEmoji(true)}`,
          `Niejądrowy: ${decideEmoji(true)}`,
          `Kierownik Zmiany: ${decideEmoji(false)}`,
          `Szkoleniowiec: ${decideEmoji(false)}`,
        ].join("\n"),
      },
    ]);
  // await success({
  //   interactionOrMsg: interaction,
  //   description: "Karta Pracownika znajduje się poniżej",
  // });
  const actionRow = (
    <ActionRow>
      <Button customId="edit">Edytuj</Button>
      {/* <Button></Button> */}
    </ActionRow>
  );
  await interaction.followUp({
    // components: [container],
    embeds: [embed],
    components: [actionRow],
    flags: MessageFlags.Ephemeral, //| MessageFlags.IsComponentsV2,
  });
  await interaction.deleteReply("@original");
  return;
};
