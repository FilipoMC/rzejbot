import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import sharedRules from "../../eslint.shared.mjs";

export default defineConfig([
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
    },
  },

  tseslint.configs.recommended,

  { rules: sharedRules },

  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
]);
