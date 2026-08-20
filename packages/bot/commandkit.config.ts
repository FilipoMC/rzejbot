import { devtools } from "@commandkit/devtools";
import { defineConfig } from "commandkit/config";
import { tasks } from "@commandkit/tasks";

export default defineConfig({
  plugins: [devtools(), tasks()],
  disablePermissionsMiddleware: true,
});
