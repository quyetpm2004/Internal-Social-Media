import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const host = process.env.DATABASE_HOST;
const useTls = host?.includes("tidbcloud.com") ?? false;

const adapter = new PrismaMariaDb({
  host,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 20,
  ...(useTls ? { ssl: { rejectUnauthorized: true } } : {}),
});
const prisma = new PrismaClient({ adapter });

export default prisma;
