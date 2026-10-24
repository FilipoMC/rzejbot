import z from "zod";

export const formSchema = z.object({
  doses: z.array(
    z.object({
      employeeId: z.number().nonnegative(),
      exposureTime: z.coerce
        .number()
        .min(0, "Czas nie może być ujemny")
        .nullable(),
      dose: z.coerce.number().min(0, "Dawka nie może być ujemna").nullable(),
    }),
  ),
  stations: z.array(
    z.object({
      station: z.string(),
      operators: z.array(
        z.object({
          employeeId: z.number().nonnegative(),
          employeeDiscordId: z.string(),
          employeeNameIC: z.string(),
          rating: z.string().min(1, "Ocena jest wymagana").nullable(),
          mode: z.string().min(1, "Tryb jest wymagany").nullable(),
          time: z.coerce.date(),
        }),
      ),
    }),
  ),
  goalMet: z.string(),
  summary: z.string(),
});
