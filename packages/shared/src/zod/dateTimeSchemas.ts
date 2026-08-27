import z from "zod";

export const dateStringSchema = z
  .string()
  .trim()
  .regex(
    /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4} ([01]\d|2[0-3]):[0-5]\d [+-]\d{2}:\d{2}$/,
  )
  .transform((input) => {
    const [date, time, offset] = input.split(" ") as Tuple<string, 3>;
    const [day, month, year] = date.split("/") as Tuple<string, 3>;

    return new Date(`${year}-${month}-${day}T${time}${offset}`);
  });

export const isoDateStringSchema = z.iso
  .datetime({ offset: true })
  .transform((input) => new Date(input));
