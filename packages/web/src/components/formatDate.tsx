"use client";

import { addMinutes, formatDate } from "date-fns";

export default function FormatDate({
  date,
  format,
  minutes,
}: {
  date: Date;
  format: string;
  minutes?: number[];
}) {
  return (
    <>
      {formatDate(
        minutes ?
          addMinutes(
            date,
            minutes.reduce((p, c) => p + c, 0),
          )
        : date,
        format,
      )}
    </>
  );
}
