import { rotateFileLog } from "@/utils/logger/pino";
import { task } from "@commandkit/tasks";

export default task({
  name: "daily-file-log-rotate",
  schedule: "0 0 * * *", // Daily at midnight
  async execute() {
    rotateFileLog();
  },
});
