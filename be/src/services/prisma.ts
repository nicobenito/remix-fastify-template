import os from 'node:os';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { env } from '~/env';

const cpus = os.cpus().length;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: cpus * 2 + 1,
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({
  adapter,
});

export * from '@prisma/client';
