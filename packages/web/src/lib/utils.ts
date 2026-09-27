import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPlain<T>(value: T): T {
  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toPlain) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [key, toPlain(value)]),
    ) as T;
  }

  return value;
}
