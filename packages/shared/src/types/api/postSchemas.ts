import z from "zod";
import { shiftPostSchema } from "@web/zod/shiftSchemas";
import { employeePostSchema } from "@web/zod/employeeSchemas";

export type ShiftPost = z.infer<typeof shiftPostSchema>;
export type EmployeePost = z.infer<typeof employeePostSchema>;
