import { config } from '../config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;