import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Enable querying over fetch for edge environments
neonConfig.poolQueryViaFetch = true;

// Type definitions - same pattern as backend
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Database connection utility for Worker - identical pattern to backend
 * Uses the same getDB(c) pattern for consistency across edge/worker
 */
export const getDB = (c: { env: { DATABASE_URL: string } }) => {
  const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  return prisma;
};

export type TDB = PrismaClient;
