import { Prisma } from "@prisma/client";

/**
 * @returns an instance of Prisma.PrismaClientKnownRequestError with a custom code for use in API routes
 */
export function CustomPrismaError(code: string, message: string = "") {
  return new Prisma.PrismaClientKnownRequestError(message, {
    clientVersion: "customprismaerror",
    code,
  });
}
