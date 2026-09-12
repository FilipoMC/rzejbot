import { sendShiftManageEmbed } from "@/app/components/zmiana/manageShiftEmbed";
import { CommandData, MessageCommand } from "commandkit";

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

  await sendShiftManageEmbed({
    client: ctx.client,
    shiftIdentifier: { id: 6 },
  });
};
