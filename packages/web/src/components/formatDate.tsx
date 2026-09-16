"use client";

import { formatDate } from "date-fns";

export default function FormatDate({
  date,
  format,
}: {
  date: Date;
  format: string;
}) {
  return <>{formatDate(date, format)}</>;
}
