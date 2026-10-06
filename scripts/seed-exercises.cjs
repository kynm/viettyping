const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { demos } = require('./exercise-demo-data.cjs');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const { validateExercise } = require('../src/lib/exercises/engine.ts');
const db = new PrismaClient();
async function main() {
  const password = process.env.EXERCISE_DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error('Set EXERCISE_DEMO_PASSWORD (at least 12 characters). Password is never logged.');
  const teacher = await db.user.upsert({ where: { username: 'exercise_teacher' }, create: { username: 'exercise_teacher', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 12) }, update: {} });
  if (teacher.role !== 'TEACHER') throw new Error('Existing username belongs to a student. Seed will not elevate or overwrite it.');
  const student = await db.user.upsert({ where: { username: 'exercise_student' }, create: { username: 'exercise_student', passwordHash: await bcrypt.hash(password, 12) }, update: {} });
  if (student.role !== 'STUDENT') throw new Error('Existing demo student username has a different role. Seed will not overwrite it.');
  await db.studentProfile.upsert({ where: { userId: student.id }, create: { userId: student.id, name: 'Học sinh demo', nickname: 'Bạn học demo', grade: 'Lớp 3' }, update: {} });
  for (const exercise of demos) {
    if (!await db.exercise.findFirst({ where: { title: exercise.title, createdBy: teacher.id } })) await db.exercise.create({ data: { ...validateExercise(exercise), createdBy: teacher.id } });
  }
  console.log('Demo exercises ready. Accounts: exercise_teacher / exercise_student. Existing passwords are preserved.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
