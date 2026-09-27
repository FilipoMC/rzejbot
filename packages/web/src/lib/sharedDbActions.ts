import config from "@shared/config/config.json";
import { Prisma } from "@prisma/client";
import { DbActionReturnType } from "@/types/dbActions";

export function getShiftStations(
  res: Prisma.ShiftEmployeeLogGetPayload<{
    select: {
      id: true;
      stations: true;
      stationTimes: true;
      rating: true;
      mode: true;
      employee: { select: { discordId: true; nameIC: true } };
    };
  }>[],
): DbActionReturnType<typeof operatorsByStation, number> {
  const stationOrder = config.stations as Record<string, number>;

  const byStation = new Map<
    string,
    {
      employeeDiscordId: string;
      employeeNameIC: string;
      rating: string | null;
      mode: string | null;
      time: Date;
    }[]
  >();

  for (const row of res) {
    if (row.stations.length !== row.stationTimes.length) {
      console.error(
        `Corrupted shiftEmployeeLog ${row.id}: stations/stationTimes length mismatch`,
      );
      return { status: "error", errorStatus: "corrupted", error: row.id };
    }

    for (let i = 0; i < row.stations.length; i++) {
      const station = row.stations[i];
      const time = row.stationTimes[i];
      const rating = row.rating[i] ?? null;
      const mode = row.mode[i] ?? null;

      const operators = byStation.get(station) ?? [];

      operators.push({
        employeeDiscordId: row.employee.discordId,
        employeeNameIC: row.employee.nameIC,
        rating,
        mode,
        time,
      });

      byStation.set(station, operators);
    }
  }

  for (const operators of byStation.values()) {
    operators.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  const operatorsByStation = byStation
    .entries()
    .toArray()
    .toSorted(([aStation], [bStation]) => {
      const aVal = stationOrder[aStation] ?? Infinity;
      const bVal = stationOrder[bStation] ?? Infinity;

      return aVal - bVal || aStation.localeCompare(bStation);
    })
    .map(([station, operators]) => {
      const deduplicated = operators.filter(
        (operator, index) =>
          index === 0 ||
          operator.employeeDiscordId !== operators[index - 1].employeeDiscordId,
      );

      return [station, deduplicated] as const;
    })
    .map(([station, operators]) => {
      return { station, operators };
    });

  return { status: "ok", data: operatorsByStation };
}
