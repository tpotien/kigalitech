import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// In development, reuse the instance across hot-reloads to avoid exhausting connections
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
