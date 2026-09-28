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
import { getRobloxUsersByIds } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getShiftStations } from "@/lib/sharedDbActions";
import { toPlain } from "@/lib/utils";
import { ranksOrder, shortRankNames } from "@shared/config/script";
import { shiftNumberSchema } from "@shared/zod/shiftSchemas";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import StationRows from "./stationRows";

async function getShiftReport(number: string) {
  "use cache";
  cacheTag(`shiftReport:number:${number}`);
  cacheLife("days");

  const res = await prisma.shiftReport.findFirst({
    where: { shift: { shiftNumber: number } },
    include: {
      shift: {
        include: {
          host: true,
          employeeLogs: {
            where: { clockedIn: { not: null } },
            include: { employee: true },
          },
        },
      },
    },
  });

  if (!res) {
    return null;
  }

  cacheTag(`shiftReport:id:${res.shiftId}`);

  res.shift.employeeLogs.sort((a, b) => {
    const aVal = ranksOrder.get(a.employee.rank) ?? Infinity;
    const bVal = ranksOrder.get(b.employee.rank) ?? Infinity;

    return aVal - bVal || a.employee.nameIC.localeCompare(b.employee.nameIC);
  });

  return toPlain(res);
}

export default async function RaportZmiany(
  props: PageProps<"/zmiana/[shiftNumber]/raport">,
) {
  const { shiftNumber } = await props.params;

  const shiftNumberParsed = shiftNumberSchema.safeParse(shiftNumber);

  if (!shiftNumberParsed.success) {
    notFound();
  }

  const shiftReport = await getShiftReport(shiftNumberParsed.data);

  if (!shiftReport) {
    notFound();
  }

  const employeeDoseList = shiftReport.shift.employeeLogs.filter(
    (v) => v.exposureTime || v.dose,
  );

  const employeeStationListRes = getShiftStations(
    shiftReport.shift.employeeLogs,
  );

  if (employeeStationListRes.status !== "ok") {
    throw new Error(
      "Stan w bazie danych nie zgadza się z założeniami, powiadom dewelopera.",
    );
  }

  const employeeStationList = employeeStationListRes.data.map((v): typeof v => {
    if (shiftReport.approved) {
      return v;
    }

    return {
      station: v.station,
      operators: v.operators.map((op) => {
        return { ...op, rating: null, mode: null };
      }),
    };
  });

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
        {shiftReport.approved ?
          "OGÓLNY RAPORT ZMIANY"
        : "WSTĘPNY RAPORT ZMIANY"}
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-center">
        {shiftReport.approved ?
          <>
            Kierownika zmiany w Elektrowni Jądrowej im. <br /> Marii
            Skłodowskiej-Curie w Żarnowcu
          </>
        : <>Wygenerowany automatycznie</>}
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
      {employeeDoseList.length > 0 ?
        <Table className="max-w-190 w-full mx-auto">
          <TableHeader>
            <TableRow noHover={true}>
              <TableHead className="text-center">Pracownik</TableHead>
              <TableHead className="text-center">
                <span className="hidden sm:block">Czas Ekspozycji</span>
                <span className="sm:hidden">Czas</span>
              </TableHead>
              <TableHead className="text-center">
                <span className="hidden sm:block">Dawka Przyjęta</span>
                <span className="sm:hidden">Dawka</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeDoseList.map((log, idx) => {
              return (
                <TableRow key={idx}>
                  <TableCell className="text-center">
                    {log.employee.nameIC}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.exposureTime !== null ?
                      `${log.exposureTime} min.`
                    : "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.dose !== null ? `${log.dose} µSv` : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      : <p className="text-center w-full text-sm italic">
          Brak zapisów z dozymetrów
        </p>
      }
      <Separator className="my-10 max-w-200 self-center" />
      {employeeStationList.length > 0 ?
        <Table className="max-w-190 w-full mx-auto">
          <TableHeader>
            <TableRow noHover={true}>
              <TableHead className="w-min mr-0 px-0"></TableHead>
              <TableHead className="pl-0 text-center">Stanowisko</TableHead>
              <TableHead className="text-center">Operator</TableHead>
              <TableHead className="text-center">Tryb</TableHead>
              <TableHead className="text-center">
                <span className="hidden sm:block">Ocena Pracy</span>
                <span className="sm:hidden">OP</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              {
                station: "Kierownik Zmiany",
                operators: [
                  {
                    employeeDiscordId: shiftReport.shift.host.discordId,
                    employeeNameIC: shiftReport.shift.host.nameIC,
                    rating: "-",
                    mode: "-",
                    time: new Date(),
                  },
                ],
              } satisfies (typeof employeeStationList)[number],
              ...employeeStationList,
            ].map((station, idx) => (
              <StationRows key={idx} station={station} />
            ))}
          </TableBody>
        </Table>
      : <p className="text-center w-full text-sm italic">
          Nie ma jeszcze przydziału stanowisk
        </p>
      }
      <Separator className="my-10 max-w-200 self-center" />
      <table className="max-w-200 w-full self-center">
        <thead>
          <tr>
            <th className="text-center align-bottom">Cel Zmiany</th>
            <th className="align-bottom w-min">
              Zwięzła Ocena Realizacji Celu
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center py-1">
              <Link
                href={`/zmiana/${shiftReport.shift.shiftNumber.replace("/", "-")}/plan`}
                className="text-sm bg-muted hover:bg-accent/70 not-dark:hover:bg-accent-foreground/20 py-1 px-2 rounded-2xl text-blue-700 dark:text-blue-300"
              >
                Plan<span className="max-sm:hidden">&nbsp;Zmiany</span>&nbsp;
                {shiftReport.shift.shiftNumber}
              </Link>
            </td>
            <td className="items-center justify-items-center w-[62%]">
              {shiftReport.approved ?
                <p className="text-center w-fit">
                  Zmiana zakończona z wynikiem{" "}
                  <span className="font-bold">
                    {shiftReport.goalMet ? "pozytywnym" : "negatywnym"}.
                  </span>
                </p>
              : <p className="text-center">N/A</p>}
            </td>
          </tr>
        </tbody>
      </table>
      {shiftReport.approved && (
        <>
          <Separator className="my-10 max-w-200 self-center" />
          <div className="max-w-200 w-full flex flex-col self-center gap-5">
            <div className="text-center font-bold max-sm:text-sm">
              Pisemny Opis Zmiany
            </div>
            <div className="text-justify w-full whitespace-pre-wrap">
              {shiftReport.summary ?? "N/A"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/zmiana/[shiftNumber]/plan">): Promise<Metadata> {
  const { shiftNumber } = await params;

  return {
    title: `Raport zmiany - ${shiftNumber.replace("-", "/")}`,
    description: `Ogólny raport zmiany Elektrowni Jądrowej w Żarnowcu`,
    openGraph: {
      title: `Raport zmiany - ${shiftNumber.replace("-", "/")}`,
      description: `Ogólny raport zmiany Elektrowni Jądrowej w Żarnowcu`,
      siteName: "System teleinformatyczny ŻEJ",
    },
  };
}
