import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  let url = (process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`).trim();
  // Convert libsql:// to https:// for serverless environments that don't support WebSockets
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
