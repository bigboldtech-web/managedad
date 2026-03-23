import { PrismaClient } from "@prisma/client";

// Enable JSON.stringify for BigInt fields returned by Prisma
// BigInt values are converted to Number (safe for impressions/clicks counts)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
