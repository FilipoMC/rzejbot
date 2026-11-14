"use server";

import { hashAccessKey } from "@/lib/accessKeys";
import { prisma } from "@/lib/prisma";
import { formSchema } from "@/zod/shiftReportEditFormSchema";
import _ from "lodash";
import { updateTag } from "next/cache";
import z from "zod";

const inputFormSchema = formSchema
  .omit({ goalMet: true })
  .extend({ goalMet: z.boolean() });

export async function submitEditShiftReportForm(
  key: string,
  shiftNumber: string,
  content: z.infer<typeof inputFormSchema>,
) {
  try {
    const [keyChecked, shiftNumberChecked, contentChecked] = z
      .tuple([z.string(), z.string(), inputFormSchema])
      .parse([key, shiftNumber, content]);

    console.log(contentChecked);

    const shiftReport = await prisma.shiftReport.findFirst({
      where: {
        shift: {
          shiftNumber: shiftNumberChecked,
        },
        accessTokenHash: hashAccessKey(keyChecked),
        approved: false,
      },
    });

    if (!shiftReport) {
      throw "nicetry";
    }

    const stationsByEmployee = contentChecked.stations.reduce(
      (prev, v) => {
        for (const operator of v.operators) {
          const prevOperator = prev.get(operator.employeeId) ?? [];

          prevOperator.push({
            station: v.station,
            time: operator.time,
            rating: operator.rating,
            mode: operator.mode,
          });

          prev.set(operator.employeeId, prevOperator);
        }

        return prev;
      },
      new Map() as Map<
        number,
        {
          station: string;
          rating: string | null;
          mode: string | null;
          time: Date;
        }[]
      >,
    );

    const employeeUpdateMap = new Map<
      number,
      {
        dose: null | Omit<(typeof contentChecked.doses)[number], "employeeId">;
        station:
          | null
          | ReturnType<
              ReturnType<typeof stationsByEmployee.values>["toArray"]
            >[number];
      }
    >();

    for (const item of [
      ...contentChecked.doses,
      ...stationsByEmployee.entries().toArray(),
    ]) {
      const employeeId = Array.isArray(item) ? item[0] : item.employeeId;
      const prev = employeeUpdateMap.get(employeeId);

      const res: NonNullable<typeof prev> =
        Array.isArray(item) ?
          { station: item[1], dose: prev?.dose ?? null }
        : { dose: _.omit(item, "employeeId"), station: prev?.station ?? null };

      employeeUpdateMap.set(employeeId, res);
    }

    await prisma.shiftReport.update({
      where: {
        shiftId: shiftReport.shiftId,
      },
      data: {
        summary: contentChecked.summary,
        goalMet: contentChecked.goalMet,
        shift: {
          update: {
            employeeLogs: {
              updateMany: employeeUpdateMap
                .entries()
                .toArray()
                .map(([employeeId, newData]) => {
                  return {
                    where: { employeeId },
                    data: {
                      dose: newData.dose?.dose ?? undefined,
                      exposureTime: newData.dose?.exposureTime ?? undefined,
                      ...newData.station?.reduce(
                        (prev, st) => {
                          return {
                            stations: {
                              set: [...prev.stations.set, st.station],
                            },
                            stationTimes: {
                              set: [...prev.stationTimes.set, st.time],
                            },
                            mode: {
                              set: [...prev.mode.set, st.mode ?? "N/A"],
                            },
                            rating: {
                              set: [...prev.rating.set, st.rating ?? "N/A"],
                            },
                          };
                        },
                        {
                          stations: { set: [] as string[] },
                          stationTimes: { set: [] as Date[] },
                          mode: { set: [] as string[] },
                          rating: { set: [] as string[] },
                        },
                      ),
                    },
                  };
                }),
            },
          },
        },
      },
    });
    updateTag(`shiftReport:id:${shiftReport.shiftId}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw "Wystąpił błąd";
  }
}
