import { PrismaClient } from "@prisma/client";

// Reuse the client across hot reloads in dev. Next.js re-evaluates this
// module on every request during `next dev`; without the global cache we
// leak a connection per file edit and hit Postgres's connection limit
// within minutes.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
