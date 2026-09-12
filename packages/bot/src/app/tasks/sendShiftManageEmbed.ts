import { task } from "@commandkit/tasks";
import { sendShiftManageEmbed } from "../components/zmiana/manageShiftEmbed";

export interface SendShiftManageEmbedTaskData {
  shiftId: number;
}

export default task<SendShiftManageEmbedTaskData>({
  name: "send-shift-manage-embed",
  async execute(ctx) {
    await sendShiftManageEmbed({
      shiftIdentifier: { id: ctx.data.shiftId },
      client: ctx.client,
    });
  },
});
