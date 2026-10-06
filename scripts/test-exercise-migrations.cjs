const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const admin = new PrismaClient(), name = `exercise_qa_${randomBytes(6).toString('hex')}`;
let scratch, created = false;
async function main() {
  if (!/^exercise_qa_[a-f0-9]{12}$/.test(name)) throw new Error('Unsafe scratch database name');
  const url = new URL(process.env.DATABASE_URL); url.pathname = '/' + name;
  await admin.$executeRawUnsafe(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
  const result = spawnSync(process.execPath, [path.resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Fresh migration deployment failed.');
  scratch = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const user = await scratch.user.create({ data: { username: 'migration_student', passwordHash: 'disabled' } });
  assert.equal(user.role, 'STUDENT');
  await scratch.studentData.create({ data: { userId: user.id, data: { legacyProgress: true } } });
  const teacher = await scratch.user.create({ data: { username: 'migration_teacher', passwordHash: 'disabled', role: 'TEACHER' } });
  const exercise = await scratch.exercise.create({ data: { createdBy: teacher.id, title: 'Migration test', description: '', grade: 3, skill: 'Vocabulary', difficulty: 'easy', unit: '', lesson: '', questions: [] } });
  const attempt = await scratch.studentAttempt.create({ data: { studentId: user.id, exerciseId: exercise.id, snapshot: [], answers: {}, totalScore: 10 } });
  assert.deepEqual(attempt.manualGrades, {}); assert.deepEqual(attempt.questionDurations, {});
  assert.equal((await scratch.studentData.findUnique({ where: { userId: user.id } })).data.legacyProgress, true);
  console.log('Fresh MySQL migration test passed: all migrations deploy, student default role, JSON defaults, FKs and legacy data coexist.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  if (scratch) await scratch.$disconnect();
  if (created && /^exercise_qa_[a-f0-9]{12}$/.test(name)) await admin.$executeRawUnsafe(`DROP DATABASE \`${name}\``);
  await admin.$disconnect();
});
