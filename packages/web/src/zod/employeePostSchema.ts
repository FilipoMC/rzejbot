import z from "zod";
import snowflake from "./snowflake";

// model Employee {
//   discordID      String  @id
//   robloxID       String  @unique
//   nameIC         String
//   rank           String
//   shiftsHosted   Shift[] @relation("EmployeeShiftsHosted")
//   shiftsAttended Shift[] @relation("EmployeeShiftsAttended")

export const employeePostSchema = z.object({
  discordID: snowflake,
  robloxID: z.int(),
  nameIC: z.string(),
  rank: z.string(),
});
