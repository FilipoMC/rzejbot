"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getShiftStations } from "@/lib/sharedDbActions";
import { submitEditShiftReportForm } from "@/serverActions/editShiftReport";
import { DbActionData } from "@/types/dbActions";
import { formSchema } from "@/zod/shiftReportEditFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Prisma } from "@prisma/client";
import _ from "lodash";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { Fragment } from "react/jsx-runtime";
import z from "zod";

type FormValues = z.infer<typeof formSchema>;

type PrismaRes = Prisma.ShiftReportGetPayload<{
  select: {
    goalMet: true;
    summary: true;

    shift: {
      select: {
        shiftNumber: true;

        host: {
          select: {
            discordId: true;
            nameIC: true;
          };
        };
        employeeLogs: {
          select: {
            employee: {
              select: {
                id: true;
                nameIC: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type Props = {
  shiftReport: PrismaRes;
  doseList: {
    employee: {
      id: number;
      nameIC: string;
    };
    exposureTime: number | null;
    dose: number | null;
  }[];
  stationList: DbActionData<ReturnType<typeof getShiftStations>>;
  accessKey: string;
};

export function EdytujZmianeForm({
  shiftReport,
  doseList,
  stationList: employeeStationList,
  accessKey,
}: Props) {
  const computedValues = useMemo(() => {
    return {
      doses: doseList.map((log) => ({
        employeeId: log.employee.id,
        exposureTime: log.exposureTime,
        dose: log.dose,
      })),
      stations: employeeStationList,
      goalMet:
        shiftReport.goalMet === true ? "pozytywnym"
        : shiftReport.goalMet === false ? "negatywnym"
        : "",
      summary: shiftReport.summary ?? "",
    } satisfies FormValues;
  }, [doseList, employeeStationList, shiftReport.goalMet, shiftReport.summary]);

  const { register, control, handleSubmit, reset } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: computedValues,
  });

  const localStorageKey = `edit-report_${shiftReport.shift.shiftNumber}`;

  const stuffLoaded = useRef(false);

  useEffect(() => {
    if (stuffLoaded.current) {
      return;
    }

    const localStorageSavedData = localStorage.getItem(localStorageKey);
    if (!localStorageSavedData) {
      return;
    }

    try {
      const data = z
        .array(formSchema)
        .length(2)
        .nullable()
        .parse(JSON.parse(localStorageSavedData));

      if (data) {
        reset(data[1]);
        if (!_.isEqual(data[0], computedValues)) {
          if (
            confirm(
              "Treść raportu zmiany na serwerze zmieniła się od ostatniego edytowania; czy chcesz nadpisać swoją pracę raportem z serwera?",
            )
          ) {
            reset(computedValues);
            localStorage.removeItem(localStorageKey);
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.error(
        "Invalid data from localStorage in editShiftReport",
        shiftReport.shift.shiftNumber,
      );
      localStorage.removeItem(localStorageKey);
      alert("W związku z nową wersją strony wersja robocza została usunięta.");
    }

    stuffLoaded.current = true;
  }, [computedValues, localStorageKey, reset, shiftReport.shift.shiftNumber]);

  const watchedSummary = useWatch({
    control,
    name: "summary",
    defaultValue: "",
  });
  const summaryWordCount =
    watchedSummary ? watchedSummary.split(/[\s\n]/).filter(Boolean).length : 0;

  const watched = useWatch({ control });
  useEffect(() => {
    localStorage.setItem(
      localStorageKey,
      JSON.stringify([computedValues, watched]),
    );
  }, [watched, computedValues, localStorageKey]);

  const onSubmit: SubmitHandler<FormValues> = (data: FormValues) => {
    submitEditShiftReportForm(accessKey, shiftReport.shift.shiftNumber, data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
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
          {doseList.map((log, idx) => {
            return (
              <TableRow key={idx}>
                <TableCell className="text-center">
                  {log.employee.nameIC}
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    placeholder={log.exposureTime?.toString() ?? undefined}
                    required
                    min={0}
                    className="w-20"
                    {...register(`doses.${idx}.exposureTime`)}
                  />
                  &nbsp;&nbsp;min
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    placeholder={log.dose?.toString() ?? undefined}
                    required
                    min={0}
                    className="w-20"
                    {...register(`doses.${idx}.dose`)}
                  />
                  &nbsp;&nbsp;µSv
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Separator className="my-10 max-w-200 self-center" />
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
            },
            ...employeeStationList,
          ].map((station, idx) => {
            const formStationIdx = idx - 1;
            const lastOpIdx = station.operators.length - 1;

            return (
              <Fragment key={idx}>
                <TableRow>
                  <TableCell className="px-0 mx-0">
                    {station.operators.length > 1 && (
                      <ChevronDown className="w-5 text-muted-foreground/50 select-none" />
                    )}
                  </TableCell>
                  <TableCell className="text-center pl-0">
                    {station.station}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hidden sm:block">
                      {station.operators.at(-1)!.employeeNameIC}
                    </span>
                    <span className="sm:hidden">
                      {`${station.operators.at(-1)!.employeeNameIC.split(" ")[0][0]}. ${station.operators.at(-1)!.employeeNameIC.split(" ")[1]}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {idx !== 0 ?
                      <Input
                        type="text"
                        placeholder={
                          station.operators.at(-1)!.mode ?? undefined
                        }
                        required
                        className="w-15"
                        {...register(
                          `stations.${formStationIdx}.operators.${lastOpIdx}.mode`,
                        )}
                      />
                    : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {idx !== 0 ?
                      <Input
                        type="text"
                        placeholder={
                          station.operators.at(-1)!.rating ?? undefined
                        }
                        required
                        className="w-15"
                        {...register(
                          `stations.${formStationIdx}.operators.${lastOpIdx}.rating`,
                        )}
                      />
                    : "-"}
                  </TableCell>
                </TableRow>

                {station.operators
                  .toReversed()
                  .slice(1)
                  .map((operator, revIdx, { length }) => {
                    const originalOpIdx = station.operators.length - 2 - revIdx;
                    return (
                      <TableRow
                        key={revIdx}
                        className={`bg-muted/60 border-t-0 ${revIdx !== length - 1 ? "border-b-muted-foreground" : "border-b-0"}`}
                      >
                        <TableCell className="px-0 mx-0"></TableCell>
                        <TableCell className="text-center pl-0">
                          {station.station}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="hidden sm:block">
                            {operator.employeeNameIC}
                          </span>
                          <span className="sm:hidden">
                            {`${operator.employeeNameIC.split(" ")[0][0]}. ${operator.employeeNameIC.split(" ")[1]}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="text"
                            placeholder={operator.mode ?? undefined}
                            required
                            className="w-15"
                            {...register(
                              `stations.${formStationIdx}.operators.${originalOpIdx}.mode`,
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="text"
                            placeholder={operator.rating ?? undefined}
                            required
                            className="w-15"
                            {...register(
                              `stations.${formStationIdx}.operators.${originalOpIdx}.rating`,
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
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
              <p className="text-center w-fit">
                Zmiana zakończona z wynikiem{" "}
                <Controller
                  name="goalMet"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-35">
                        <SelectValue placeholder="Wynik" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="pozytywnym">Pozytywny</SelectItem>
                          <SelectItem value="negatywnym">Negatywny</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <Separator className="my-10 max-w-200 self-center" />
      <div className="max-w-200 w-full flex flex-col self-center">
        <div className="text-center font-bold max-sm:text-sm mb-5">
          Pisemny Opis Zmiany
        </div>
        <div className="text-justify w-full whitespace-pre-wrap"></div>
        <Textarea {...register("summary")} required />
        <div className="text-muted-foreground text-sm">
          <span className="italic">Słowa:</span> {summaryWordCount}
        </div>
      </div>
      <Separator className="my-10 max-w-200 self-center" />
      <Button type="submit" className="self-center w-full max-w-200 h-10">
        Zapisz
      </Button>
      <div className="h-5"></div>
      <Button
        className="self-center"
        variant="destructive"
        type="button"
        onClick={() => {
          if (
            confirm(
              "Czy na pewno chcesz zresetować formularz do wartości z serwera?",
            )
          ) {
            reset(computedValues);
          }
        }}
      >
        Zresetuj
      </Button>
    </form>
  );
}
