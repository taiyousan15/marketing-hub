import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  // ビルド時やDB接続がない場合はダミークライアントを返す
  if (!databaseUrl) {
    return new PrismaClient();
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    // Transaction pooler (port 6543) への同時接続上限。
    // 1プロセスあたり5本に抑えることで複数devサーバーが共存できる。
    max: 5,
    // 接続取得タイムアウト (ms)
    connectionTimeoutMillis: 5_000,
    // アイドル接続の解放 (ms) — Vercel serverless向けに短く設定
    idleTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
