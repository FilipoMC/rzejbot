"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ToggleDarkMode() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="hover:cursor-pointer"
    >
      <Moon className="dark:hidden max-md:w-10 max-md:h-10" />
      <Sun className="hidden dark:block max-md:w-10 max-md:h-10" />
    </button>
  );
}
