import { SubcommandHandler } from "@/types/commands";
import { success } from "@/utils/commandResponses";
import { codeBlock } from "discord.js";

const scheduleShiftHandler: SubcommandHandler = async ({ interaction }) => {
  await success({
    interactionOrMsg: interaction,
    description: codeBlock(
      "json",
      JSON.stringify(interaction.options, null, 2),
    ),
    ephemeral: true,
  });
};

export default scheduleShiftHandler;
