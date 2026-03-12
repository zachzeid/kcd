import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  // Bot uses BOT_DATABASE_URL if set (for Turso), otherwise falls back to DATABASE_URL
  let url = (process.env.BOT_DATABASE_URL || process.env.DATABASE_URL || `file:${path.join(process.cwd(), "prisma", "dev.db")}`).trim();
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  const authToken = (process.env.BOT_DATABASE_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN)?.trim() || undefined;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
