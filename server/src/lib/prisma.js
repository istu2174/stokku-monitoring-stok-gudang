import { PrismaClient } from '@prisma/client';

/** Satu instance Prisma untuk seluruh aplikasi. */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
