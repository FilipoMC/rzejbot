import { ApiHelper } from "@/helper/apiHelper";
import { success } from "@/utils/commandResponses";
import { CommandData, MessageCommand } from "commandkit";
import { codeBlock } from "discord.js";

export const command: CommandData = {
  name: "test",
  description: "halo",
};

export const message: MessageCommand = async (ctx) => {
  // const res = await ApiHelper.shifts.create({
  //   host: "725981321196732436",
  //   notes: "asdf",
  //   plannedDate: new Date(),
  //   shiftGoal: "asdf",
  //   shiftNumber: "000-26",
  //   shortDesc: "asfsa",
  //   unit: "III",
  // });

  const res = await ApiHelper.shifts.logEmployeeAbsence(3, {
    employeeDiscordId: "725981321196732436",
  });

  await success({
    interactionOrMsg: ctx.message,
    description: codeBlock("json", JSON.stringify(res, null, 2)),
  });
};
