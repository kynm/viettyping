const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch {
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
