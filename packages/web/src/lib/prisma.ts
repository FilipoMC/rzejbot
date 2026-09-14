import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient().$extends({
  result: {
    employee: {
      robloxId: {
        needs: { robloxId: true },
        compute(employee) {
          return Number(employee.robloxId);
        },
      },
    },
  },
});
