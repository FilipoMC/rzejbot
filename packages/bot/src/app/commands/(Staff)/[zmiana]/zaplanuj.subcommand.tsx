import {
  AutocompleteCommand,
  ChatInputCommand,
  CommandData,
  Label,
  Modal,
  ModalKit,
  RadioGroup,
  RadioGroupOption,
  TextInput,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  codeBlock,
  ModalSubmitInteraction,
  TextInputStyle,
} from "discord.js";
import { ApplicationCommandOptionChoiceData } from "discord.js";
import other from "@/config/other.json";
import { fromZonedTime } from "date-fns-tz";
import sharedConfig from "@shared/config/config.json";
import { addDays } from "date-fns";
import { formatDate } from "date-fns/format";
import { failedToExecute, success } from "@/utils/commandResponses";
import { anyDateStringSchema } from "@shared/zod/dateTimeSchemas";

export const command: CommandData = {
  name: "zaplanuj",
  description: "Zaplanuj zmianę",
  options: [
    {
      name: "kiedy",
      description: "kiedy jest zmiana, w formacie DD/MM/YYYY HH:MM",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  const dateUnparsed = interaction.options.getString("kiedy", true);

  const dateParsed = anyDateStringSchema.safeParse(dateUnparsed);

  if (!dateParsed.success) {
    await failedToExecute({
      interactionOrMsg: interaction,
      description: "Wprowadzona data zmiany jest nieprawidłowa",
    });
    return;
  }

  // const date = dateParsed.data;

  const modal = (
    <Modal title="Zaplanuj zmianę" onSubmit={modalHandler}>
      <Label label="Numer zmiany w formacie XXX/YY">
        <TextInput
          customId="shiftNumber"
          required
          style={TextInputStyle.Short}
          placeholder="006/26"
          maxLength={6}
        />
      </Label>
      <Label label="Unit na którym zmiana będzie miała miejsce">
        <RadioGroup customId="unit" required>
          <RadioGroupOption label="Unit I" value="1" />
          <RadioGroupOption label="Unit II" value="2" />
          <RadioGroupOption label="Unit I/II" value="3" />
        </RadioGroup>
      </Label>
      <Label label="Opis event'u na discordzie">
        <TextInput
          customId="shortDesc"
          style={TextInputStyle.Paragraph}
          required
        />
      </Label>
      <Label label="Cel Zmiany">
        <TextInput
          customId="shiftGoal"
          style={TextInputStyle.Paragraph}
          required
        />
      </Label>
      <Label label="Instrukcje i Uwagi">
        <TextInput customId="notes" style={TextInputStyle.Paragraph} required />
      </Label>
    </Modal>
  );
  await interaction.showModal(modal);
  async function modalHandler(
    interaction: ModalSubmitInteraction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: ModalKit,
  ) {
    await success({
      interactionOrMsg: interaction,
      description: codeBlock(
        "json",
        JSON.stringify(interaction.fields, null, 2),
      ),
    });
  }
};

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  const input = interaction.options.getString("kiedy", true);

  if (!input) {
    const fallbackAutoComp: ApplicationCommandOptionChoiceData[] = [];

    for (let i = 1; i <= 25; i++) {
      const defaultShiftTime = other.shifts.defaultShiftTime.split(":");

      if (!defaultShiftTime[0] || !defaultShiftTime[1]) {
        await interaction.respond([]);
        return;
      }

      const dateHelper = (num: number) => {
        if (num < 10) {
          return `0${num}`;
        }
        return num;
      };

      const now = new Date();

      const defaultDate = fromZonedTime(
        "".concat(
          ...[
            now.getFullYear(),
            "-",
            dateHelper(now.getMonth() + 1),
            "-",
            dateHelper(now.getDate()),
            " ",
            defaultShiftTime[0],
            ":",
            defaultShiftTime[1],
            ":00",
          ].map((v) => v.toString()),
        ),
        sharedConfig.timezone,
      );

      const newDate = addDays(defaultDate, 1);

      fallbackAutoComp.push({
        name: formatDate(newDate, "dd/MM/yyyy HH:mm"),
        value: newDate.toISOString(),
      });
    }
    await interaction.respond(fallbackAutoComp);
  } else {
    await interaction.respond([{ name: input, value: input }]);
  }
};
