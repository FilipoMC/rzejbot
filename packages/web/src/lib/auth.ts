import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { cacheTag } from "next/cache";
import { prisma } from "./prisma";
import { toPlain } from "./utils";
import { redirect } from "next/navigation";

async function getEmployees() {
  "use cache";

  cacheTag("all");
  cacheTag("employees");

  const employees = await prisma.employee.findMany({
    where: {
      active: true,
    },
    include: {
      employeeChanges: {
        select: { newRole: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return toPlain(employees);
}

export async function getCurrentEmployee() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return getEmployeeById(Number(session.user.id));
}

export async function requireEmployee() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/login");
  }

  return employee;
}

export async function getEmployeeByDiscordId(discordId?: string | null) {
  if (!discordId) {
    return null;
  }

  const employees = await getEmployees();

  const employee = employees.find((e) => e.discordId === discordId) ?? null;

  if (!employee) {
    return null;
  }

  return {
    ...employee,
    rank: employee.employeeChanges[0].newRole,
  };
}

export async function getEmployeeById(id?: number | null) {
  if (!id) {
    return null;
  }

  const employees = await getEmployees();

  const employee = employees.find((e) => e.id === id) ?? null;

  if (!employee) {
    return null;
  }

  return {
    ...employee,
    rank: employee.employeeChanges[0].newRole,
  };
}

async function getEmployeeForAuth(discordId?: string | null) {
  if (!discordId) {
    return null;
  }

  return await prisma.employee.findUnique({
    where: { discordId, active: true },
    select: {
      id: true,
      nameIC: true,
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      authorization: { params: { scope: "identify" } },
      issuer: "https://discord.com",
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (!account) {
        return token;
      }

      const employee = await getEmployeeForAuth(profile?.id);
      if (employee) {
        token.employeeId = employee.id;
        token.nameIC = employee.nameIC;
        token.pfp = profile?.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (
        typeof token.nameIC === "string" &&
        typeof token.employeeId === "number"
      ) {
        session.user.id = token.employeeId.toString();
        session.user.name = token.nameIC;
      }

      session.user.image = token.picture;
      return session;
    },
    async signIn({ profile }) {
      const employee = await getEmployeeByDiscordId(profile?.id);

      return !!employee;
    },
  },
});
