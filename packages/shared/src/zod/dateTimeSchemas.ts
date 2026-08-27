import { fromZonedTime } from "date-fns-tz";
import z from "zod";
import config from "../config/config.json";

export const dateStringSchema = z
  .string()
  .trim()
  .regex(
    /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4} ([01]\d|2[0-3]):[0-5]\d$/,
  )
  .transform((input) => {
    const [date, time] = input.split(" ") as Tuple<string, 3>;
    const [day, month, year] = date.split("/") as Tuple<string, 3>;

    return fromZonedTime(`${year}-${month}-${day}T${time}`, config.timezone);
  });

export const isoDateStringSchema = z.iso
  .datetime()
  .transform((input) => fromZonedTime(input, config.timezone));

export const anyDateStringSchema = z.union([
  dateStringSchema,
  isoDateStringSchema,
]);
