"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { getShiftStations } from "@/lib/sharedDbActions";
import { DbActionData } from "@/types/dbActions";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export default function StationRows({
  station,
}: {
  station: DbActionData<ReturnType<typeof getShiftStations>>[number];
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (station.operators.length === 1) {
    return (
      <TableRow>
        <TableCell className="px-0 mx-0"></TableCell>
        <TableCell className="text-center pl-0">{station.station}</TableCell>
        <TableCell className="text-center">
          <span className="hidden sm:block">
            {station.operators[0].employeeNameIC}
          </span>
          <span className="sm:hidden">
            {`${station.operators[0].employeeNameIC.split(" ")[0][0]}. ${station.operators[0].employeeNameIC.split(" ")[1]}`}
          </span>
        </TableCell>
        <TableCell className="text-center">
          {station.operators[0].mode?.replace("-", "—") ?? "N/A"}
        </TableCell>
        <TableCell className="text-center">
          {station.operators[0].rating?.replace("-", "—") ?? "N/A"}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow>
        <TableCell className="px-0 mx-0">
          <ChevronsUpDown
            className="w-5 text-muted-foreground/50"
            onClick={() => setIsOpen(!isOpen)}
          />
        </TableCell>
        <TableCell className="text-center pl-0">{station.station}</TableCell>
        <TableCell className="text-center">
          <span className="hidden sm:block">
            {station.operators.at(-1)!.employeeNameIC}
          </span>
          <span className="sm:hidden">
            {`${station.operators.at(-1)!.employeeNameIC.split(" ")[0][0]}. ${station.operators.at(-1)!.employeeNameIC.split(" ")[1]}`}
          </span>
        </TableCell>
        <TableCell className="text-center">
          {station.operators.at(-1)!.mode?.replace("-", "—") ?? "N/A"}
        </TableCell>
        <TableCell className="text-center">
          {station.operators.at(-1)!.rating?.replace("-", "—") ?? "N/A"}
        </TableCell>
      </TableRow>

      {station.operators
        .toReversed()
        .slice(1)
        .map((operator, idx, { length }) => {
          return (
            isOpen && (
              <TableRow
                key={idx}
                className={`bg-muted/60 border-t-0 ${idx !== length - 1 ? "border-b-muted-foreground" : "border-b-0"}`}
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
                  {operator.mode?.replace("-", "—") ?? "N/A"}
                </TableCell>
                <TableCell className="text-center">
                  {operator.rating?.replace("-", "—") ?? "N/A"}
                </TableCell>
              </TableRow>
            )
          );
        })}
    </>
  );
}
