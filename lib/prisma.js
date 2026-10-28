import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:postgres@localhost:5432/dummy_heer_ranjha?schema=public",
        },
      },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
