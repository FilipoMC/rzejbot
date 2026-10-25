import { commandError, commandSuccess } from "@/utils/commandResponses";
import { employeeWithChangesAPIResponseSchema } from "@shared/zod/apiResponses/employee";
import { CommandData, Logger, MessageCommand } from "commandkit";
import { EmbedBuilder } from "discord.js";
import z from "zod";
import channels from "@/config/channels";

export const command: CommandData = {
  name: "test",
  description: "halo",
};

export const message: MessageCommand = async (ctx) => {
  // const res = await ApiHelper.shifts.create({
  //   host: "705701074975195178",
  //   notes: "asdf",
  //   plannedDate: new Date(),
  //   shiftGoal: "asdf",
  //   shiftNumber: "000/26",
  //   shortDesc: "asfsa",
  //   unit: "III",
  // });
  // const res = await ApiHelper.shifts.logEmployeeAbsence(1, {
  //   employeeDiscordId: "725981321196732436",
  // });
  // const res = await ApiHelper.shifts.getById(1);
  // const res = await ApiHelper.shifts.getByShiftNumber("000/26");
  // await success({
  //   interactionOrMsg: ctx.message,
  //   description: codeBlock("json", JSON.stringify(res, null, 2)),
  // });
  // await sendShiftManageEmbed({
  //   client: ctx.client,
  //   shiftIdentifier: { id: 6 },
  // });
  // const test = employeeWithChangesAPIResponseSchema.safeParse(
  //   JSON.parse(`{
  // 	"id": 3,
  // 	"discordId": "1467509269208498359",
  // 	"robloxId": 1306320433,
  // 	"nameIC": "Eliasz Starszyński",
  // 	"rank": "Inżynier Reaktora",
  // 	"updatedAt": "2026-09-13T16:30:17.399Z",
  // 	"createdAt": "2026-08-30T16:19:11.449Z",
  // 	"qualification": {
  // 		"pracownik": false,
  // 		"jadrowy": false,
  // 		"kierownikZmiany": false,
  // 		"szkoleniowiec": false
  // 	},
  // 	"employeeChanges": [
  // 		{
  // 			"issuer": {
  // 				"id": 17,
  // 				"discordId": "1454303387570143325",
  // 				"robloxId": 7211050009,
  // 				"nameIC": "gregory bzykacz",
  // 				"rank": "Kandydat"
  // 			},
  // 			"type": "termination",
  // 			"reason": "chciales to masz",
  // 			"note": "nie strasz nie strasz bo sie zesrasz",
  // 			"newRole": "Kandydat",
  // 			"createdAt": "2026-10-12T19:59:59.348Z",
  // 			"updatedAt": "2026-10-12T19:58:23.294Z"
  // 		}
  // 	]
  // }`),
  // );
  // if (test.success) {
  //   await commandSuccess({
  //     interactionOrMsg: ctx.message,
  //     description: "brawo omg\n\n" + test.data,
  //   });
  //   return;
  // }
  // Logger.error(z.prettifyError(test.error));
  // const channel = await ctx.message.guild.channels.fetch(channels.opinie_uwagi);
  // if (!channel?.isSendable()) {
  //   await commandError({
  //     interactionOrMsg: ctx.message,
  //     description: `Wystąpił problem podczas wysyłania wiadomości na kanał, pomyślnie zapisano opinię w bazie danych. Należy manualnie wysłać wiadomość:\n\n`,
  //   });
  //   return;
  // }
  // await channel.send({
  //   embeds: [embed],
  // });
};

// export const chatInput: ChatInputCommand = async ({ interaction }) => {
//   const msg = await interaction.reply({ content: "halo", flags: "Ephemeral" });
//   await msg.edit("aesiftubsabgd");
// };
