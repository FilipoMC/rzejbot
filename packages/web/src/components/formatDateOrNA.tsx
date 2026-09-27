"use client";

import { addMinutes } from "date-fns";
import FormatDate from "./formatDate";

/**
 * @param minutes The minutes to add to the date
 * @returns date + all minutes OR N/A if any of minutes is null
 */
export default function FormatDateOrNA({
  date,
  format,
  minutes,
}: {
  date: Date | null;
  format: string;
  minutes?: (number | null)[];
}) {
  if (!date || (minutes && minutes.includes(null))) {
    return "N/A";
  }

  return (
    <FormatDate
      date={
        minutes ?
          addMinutes(
            date,
            (minutes as number[]).reduce((p, c) => p + c, 0),
          )
        : date
      }
      format={format}
    />
  );
}
