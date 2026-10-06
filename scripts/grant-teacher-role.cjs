const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const username = process.argv[2];
  if (!username || !/^[a-z][a-z0-9_]{2,29}$/.test(username)) throw new Error('Usage: node scripts/grant-teacher-role.cjs <existing_username>');
  const user = await db.user.findUnique({ where: { username } });
  if (!user) throw new Error('Account must already exist.');
  await db.user.update({ where: { id: user.id }, data: { role: 'TEACHER' } });
  console.log('Teacher role granted. Existing authentication and password preserved.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
