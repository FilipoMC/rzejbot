import RichText from "@/components/richText";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getRobloxUsersByIds } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { addMinutes, formatDate } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function getShift(number: string) {
  "use cache";
  cacheTag(`shift:${number}`);
  cacheLife("days");

  const res = await prisma.shift.findUnique({
    where: { shiftNumber: number },
    include: { host: true },
  });

  if (!res) return null;

  return JSON.parse(JSON.stringify(res));
}

async function RobloxUsername({ robloxId }: { robloxId: number }) {
  const users = await getRobloxUsersByIds([robloxId]);

  return <>{users?.[0]?.displayName ?? "N/A"}</>;
}

export default async function PlanZmiany(
  props: PageProps<"/zmiana/[shiftNumber]/plan">,
) {
  const { shiftNumber } = await props.params;

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    notFound();
  }

  const shift = await getShift(shiftNumberParsed.data);

  if (!shift) {
    notFound();
  }

  return (
    <div className="flex flex-col m-5 sm:m-10 text-base sm:text-lg">
      <h1 className="text-xl sm:text-3xl font-bold text-center">
        OGÓLNY PLAN ZMIANY
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-center">
        Elektrowni Jądrowej im. <br /> Marii Skłodowskiej-Curie w Żarnowcu
      </h2>
      <div className="h-10"></div>
      <table className="max-w-200 w-full self-center">
        <thead>
          <tr>
            <th className="text-center align-bottom">Numer zmiany</th>
            <th className="text-center align-bottom">
              Przydzielony Kierownik zmiany
            </th>
            <th className="text-center align-bottom">Dzień zmiany</th>
            <th className="text-center align-bottom">Blok</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">{shiftNumberParsed.data}</td>
            <td className="text-center">
              <Popover>
                <PopoverTrigger>{shift.host.nameIC}</PopoverTrigger>
                <PopoverContent>
                  <table>
                    <tbody>
                      <tr>
                        <td className="text-left font-bold">Ranga:</td>
                        <td className="text-left"> {shift.host.rank} </td>
                      </tr>
                      <tr>
                        <td className="text-left font-bold">Roblox:</td>
                        <td className="text-left">
                          {" "}
                          <Suspense fallback={"Ładowanie..."}>
                            <RobloxUsername robloxId={shift.host.robloxId} />
                          </Suspense>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </PopoverContent>
              </Popover>
            </td>
            <td className="text-center">
              {formatDate(shift.plannedDate, "dd.MM.yyyy")}
            </td>
            <td className="text-center">I</td>
          </tr>
        </tbody>
      </table>
      <Separator className="my-10 max-w-200 self-center" />
      <table className="max-w-200 w-full self-center">
        <thead>
          <tr>
            <th className="text-center align-bottom">
              Planowana Godzina Rozpoczęcia Briefingu
            </th>
            <th className="text-center align-bottom">
              Planowana Godzina Rozpoczęcia Zmiany
            </th>
            <th className="text-center align-bottom">
              Planowana Godzina Zakończenia Zmiany
            </th>
            <th className="text-center align-bottom">
              Planowany Czas Trwania Zmiany
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">
              {formatDate(shift.plannedDate, "HH:mm")}
            </td>
            <td className="text-center">
              {formatDate(
                addMinutes(shift.plannedDate, shift.plannedBriefingDuration),
                "HH:mm",
              )}
            </td>
            <td className="text-center">
              {formatDate(
                addMinutes(
                  shift.plannedDate,
                  shift.plannedBriefingDuration + shift.plannedDuration,
                ),
                "HH:mm",
              )}
            </td>
            <td className="text-center">{shift.plannedDuration} minut</td>
          </tr>
        </tbody>
      </table>
      <Separator className="my-10 max-w-200 self-center" />
      <div className="max-w-200 flex flex-col gap-3 self-center">
        <h2 className="text-lg sm:text-xl font-bold text-center">Cel Zmiany</h2>
        <p className="text-justify whitespace-pre-wrap">
          <RichText>{shift.shiftGoal}</RichText>
        </p>
      </div>
      <Separator className="my-10 max-w-200 self-center" />
      <div className="max-w-200 flex flex-col gap-3 self-center">
        <h2 className="text-lg sm:text-xl font-bold text-center">
          Instrukcje i Uwagi
        </h2>
        <p className="text-justify whitespace-pre-wrap">
          <RichText>{shift.notes}</RichText>
        </p>
      </div>
    </div>
  );
}
