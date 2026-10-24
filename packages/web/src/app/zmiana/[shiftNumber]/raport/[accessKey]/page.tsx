import FormatDate from "@/components/formatDate";
import FormatDateOrNA from "@/components/formatDateOrNA";
import RobloxUsername from "@/components/robloxUsername";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hashAccessKey } from "@/lib/accessKeys";
import { getRobloxUsersByIds } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getShiftStations } from "@/lib/sharedDbActions";
import { toPlain } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { ranksOrder, shortRankNames } from "@shared/config/script";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EdytujZmianeForm } from "./form";

const shiftReportSelect = {
  date: true,
  briefingDuration: true,
  duration: true,
  approved: true,
  goalMet: true,
  summary: true,

  shift: {
    select: {
      id: true,
      shiftNumber: true,
      unit: true,

      host: {
        select: {
          discordId: true,
          nameIC: true,
          rank: true,
          robloxId: true,
        },
      },

      employeeLogs: {
        where: {
          clockedIn: { not: null },
        },
        select: {
          id: true,

          exposureTime: true,
          dose: true,

          clockedIn: true,
          clockedTime: true,

          stations: true,
          stationTimes: true,
          rating: true,
          mode: true,

          employee: {
            select: {
              id: true,
              discordId: true,
              nameIC: true,
              rank: true,
              robloxId: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ShiftReportSelect;

async function getShiftReport(number: string, accessKey: string) {
  "use cache";
  cacheTag("all");
  cacheTag(`shiftReport:number:${number}`);
  cacheTag(`shiftReportEdit:number:${number}`);
  cacheLife("days");

  const res = await prisma.shiftReport.findFirst({
    where: {
      shift: { shiftNumber: number },
      accessTokenHash: hashAccessKey(accessKey),
    },
    select: shiftReportSelect,
  });

  if (!res) {
    return null;
  }

  cacheTag(`shiftReport:id:${res.shift.id}`);
  cacheTag(`shiftReportEdit:id:${res.shift.id}`);

  res.shift.employeeLogs.sort((a, b) => {
    const aVal = ranksOrder.get(a.employee.rank) ?? Infinity;
    const bVal = ranksOrder.get(b.employee.rank) ?? Infinity;

    return aVal - bVal || a.employee.nameIC.localeCompare(b.employee.nameIC);
  });

  return toPlain(res);
}

export default async function RaportZmiany(
  props: PageProps<"/zmiana/[shiftNumber]/raport/[accessKey]">,
) {
  const { shiftNumber, accessKey } = await props.params;

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    notFound();
  }

  const shiftReport = await getShiftReport(shiftNumberParsed.data, accessKey);

  if (!shiftReport || shiftReport.approved) {
    notFound();
  }

  const employeeDoseList = shiftReport.shift.employeeLogs
    .filter((v) => v.exposureTime || v.dose)
    .map((v) => {
      return {
        employee: { id: v.employee.id, nameIC: v.employee.nameIC },
        exposureTime: v.exposureTime,
        dose: v.dose,
      };
    });

  const employeeStationListRes = getShiftStations(
    shiftReport.shift.employeeLogs,
  );

  if (employeeStationListRes.status !== "ok") {
    throw new Error(
      "Stan w bazie danych nie zgadza się z założeniami, powiadom dewelopera.",
    );
  }

  const employeeStationList = employeeStationListRes.data;

  const employeeRobloxUsers = await getRobloxUsersByIds(
    shiftReport.shift.employeeLogs.map((v) => v.employee.robloxId),
  );

  const employeeRobloxMap = new Map(
    employeeRobloxUsers?.reduce(
      (prev, v) => [...prev, [v.id, v.displayName]],
      [] as [number, string][],
    ),
  );

  return (
    <div className="flex flex-col m-4 sm:m-10 text-base sm:text-lg [&_thead]:max-sm:text-sm">
      <h1 className="text-xl sm:text-3xl font-bold text-center">
        RAPORT ZMIANY
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-center">
        Edytowanie raportu zmiany
      </h2>
      <div className="h-10"></div>
      <table className="max-w-200 w-full self-center">
        <thead>
          <tr>
            <th className="text-center align-bottom">Numer zmiany</th>
            <th className="text-center align-bottom">Kierownik zmiany</th>
            <th className="text-center align-bottom">Dzień zmiany</th>
            <th className="text-center align-bottom min-[20rem]:min-w-11">
              Blok
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">{shiftReport.shift.shiftNumber}</td>
            <td className="text-center">
              <Popover>
                <PopoverTrigger>{shiftReport.shift.host.nameIC}</PopoverTrigger>
                <PopoverContent>
                  <table>
                    <tbody>
                      <tr>
                        <td className="text-left font-bold">Ranga:</td>
                        <td className="text-left">
                          {shiftReport.shift.host.rank}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left font-bold">Roblox:</td>
                        <td className="text-left">
                          {" "}
                          <Suspense fallback={"Ładowanie..."}>
                            <RobloxUsername
                              robloxId={shiftReport.shift.host.robloxId}
                            />
                          </Suspense>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </PopoverContent>
              </Popover>
            </td>
            <td className="text-center">
              <FormatDate date={shiftReport.date} format="dd.MM.yyyy" />
            </td>
            <td className="text-center">{shiftReport.shift.unit}</td>
          </tr>
        </tbody>
      </table>
      <Separator className="my-10 max-w-200 self-center" />
      <table className="max-w-200 w-full self-center">
        <thead>
          <tr>
            <th className="text-center align-bottom">
              Godzina Rozpoczęcia Briefingu
            </th>
            <th className="text-center align-bottom">
              Godzina Rozpoczęcia Zmiany
            </th>
            <th className="text-center align-bottom">
              Godzina Zakończenia Zmiany
            </th>
            <th className="text-center align-bottom">Czas Trwania Zmiany</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">
              <FormatDate date={shiftReport.date} format="HH:mm" />
            </td>
            <td className="text-center">
              <FormatDateOrNA
                date={shiftReport.date}
                format="HH:mm"
                minutes={[shiftReport.briefingDuration]}
              />
            </td>
            <td className="text-center">
              <FormatDateOrNA
                date={shiftReport.date}
                format="HH:mm"
                minutes={[shiftReport.briefingDuration, shiftReport.duration]}
              />
            </td>
            <td className="text-center">
              {shiftReport.duration ? `${shiftReport.duration} minut` : "N/A"}
            </td>
          </tr>
        </tbody>
      </table>
      <Separator className="my-10 max-w-200 self-center" />
      {shiftReport.shift.employeeLogs.length > 0 ?
        <Table className="max-w-190 w-full mx-auto">
          <TableHeader>
            <TableRow noHover={true}>
              <TableHead className="text-center">Obecny Pracownik</TableHead>
              <TableHead className="text-center">Ranga</TableHead>
              <TableHead className="max-w-10 text-center">
                <span className="hidden sm:block">Wejście</span>
                <span className="sm:hidden">We</span>
              </TableHead>
              <TableHead className="max-w-10 text-center">
                <span className="hidden sm:block">Wyjście</span>
                <span className="sm:hidden">Wy</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftReport.shift.employeeLogs.map((log, idx) => {
              return (
                <TableRow key={idx}>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger>{log.employee.nameIC}</PopoverTrigger>
                      <PopoverContent>
                        <table>
                          <tbody>
                            <tr>
                              <td className="text-left font-bold">Ranga:</td>
                              <td className="text-left">
                                {log.employee.rank}{" "}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-left font-bold">Roblox:</td>
                              <td className="text-left">
                                {employeeRobloxMap.get(
                                  log.employee.robloxId ?? "N/A",
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hidden sm:block">{log.employee.rank}</span>
                    <span className="sm:hidden">
                      {shortRankNames.get(log.employee.rank) ??
                        log.employee.rank}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <FormatDate date={log.clockedIn!} format="HH:mm" />
                  </TableCell>
                  <TableCell className="text-center">
                    <FormatDateOrNA
                      date={log.clockedIn}
                      format="HH:mm"
                      minutes={[log.clockedTime]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      : <p className="text-center w-full text-sm italic">
          Nie ma jeszcze zapisu obecności
        </p>
      }
      <Separator className="my-10 max-w-200 self-center" />
      <EdytujZmianeForm
        shiftReport={shiftReport}
        stationList={employeeStationList}
        doseList={employeeDoseList}
        accessKey={accessKey}
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan">): Promise<Metadata> {
  const { shiftNumber } = await params;

  return {
    title: `Edytowanie raportu zmiany - ${shiftNumber.replace("-", "/")}`,
    description: `Edytowanie raportu zmiany`,
    openGraph: {
      title: `Edytowanie raportu zmiany - ${shiftNumber.replace("-", "/")}`,
      description: `Edytowanie raportu zmiany`,
      siteName: "System teleinformatyczny ŻEJ",
    },
  };
}
