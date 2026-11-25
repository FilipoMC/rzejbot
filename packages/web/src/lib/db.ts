import { mainRanks } from "@shared/config/ranks";
import { prisma } from "./prisma";

/**
 * gets the active GI and KB at the param time
 * @param time the time to find managers for
 */
export async function getManagers(time: Date) {
  const sideRes = await prisma.employee.findMany({
    select: {
      nameIC: true,
      employeeChanges: {
        where: {
          createdAt: {
            lte: time,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { newRole: true },
      },
    },
  });

  const ranksAllowedToBeManagers = [
    "Główny Inżynier Elektrowni",
    "Kierownik Bloków",
    "p.o. Kierownika Bloków",
  ] satisfies Array<keyof typeof mainRanks>;

  const managers = sideRes.filter((v) =>
    (ranksAllowedToBeManagers as string[]).includes(
      v.employeeChanges[0]?.newRole ?? "",
    ),
  );

  const actingUM = managers.find(
    (v) =>
      v.employeeChanges[0].newRole ===
      ("p.o. Kierownika Bloków" satisfies (typeof ranksAllowedToBeManagers)[number]),
  );
  const mainUM = managers.find(
    (v) =>
      v.employeeChanges[0].newRole ===
      ("Kierownik Bloków" satisfies (typeof ranksAllowedToBeManagers)[number]),
  );

  const mainME = managers.find(
    (v) =>
      v.employeeChanges[0].newRole ===
      ("Główny Inżynier Elektrowni" satisfies (typeof ranksAllowedToBeManagers)[number]),
  );

  if (!mainME) {
    console.error("theres no GI assigned at", time);
    return null;
  }

  return { unit: { actingUM, mainUM }, mainME };
}
