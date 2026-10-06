import { Prisma } from '@prisma/client';
export async function awardCompletion(tx: Prisma.TransactionClient, attempt: { studentId: number; exerciseId: number; mode: string; submittedAt: Date | null; showResult: boolean }, result: { score: number; totalScore: number }) {
  // Hidden scores must not be inferable from perfect-score XP, stars or badges.
  const accuracy = attempt.showResult ? result.score / result.totalScore : 0;
  await tx.exerciseReward.upsert({ where: { studentId_exerciseId: { studentId: attempt.studentId, exerciseId: attempt.exerciseId } }, create: { studentId: attempt.studentId, exerciseId: attempt.exerciseId, createdAt: new Date(), xp: 10 + (accuracy === 1 ? 20 : 0), stars: accuracy === 1 ? 3 : accuracy >= .7 ? 2 : 1, badge: accuracy === 1 ? 'Perfect Score' : 'First Exercise' }, update: {} });
  await tx.exerciseReward.updateMany({ where: { studentId: attempt.studentId, exerciseId: attempt.exerciseId, stars: { lt: accuracy === 1 ? 3 : accuracy >= .7 ? 2 : 1 } }, data: { xp: accuracy === 1 ? 30 : 10, stars: accuracy === 1 ? 3 : accuracy >= .7 ? 2 : 1, badge: accuracy === 1 ? 'Perfect Score' : 'First Exercise' } });
  const badges = ['First Exercise', ...(accuracy === 1 ? ['Perfect Score'] : [])];
  if (attempt.mode === 'daily') {
    const day = new Date((attempt.submittedAt?.getTime() ?? Date.now()) + 7 * 3600000).toISOString().slice(0, 10);
    await tx.studentDailyBonus.upsert({ where: { studentId_day: { studentId: attempt.studentId, day } }, create: { studentId: attempt.studentId, day, xp: 10 }, update: {} });
  }
  const days = await tx.$queryRaw<{ day: string }[]>(Prisma.sql`SELECT DISTINCT DATE_FORMAT(DATE_ADD(submitted_at, INTERVAL 7 HOUR), '%Y-%m-%d') AS day FROM student_attempts WHERE student_id = ${attempt.studentId} AND submitted_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 32 DAY) ORDER BY day DESC`);
  let streak = 0;
  if (days[0]) { let date = new Date(days[0].day + 'T00:00:00Z'); for (const entry of days) { if (entry.day !== date.toISOString().slice(0, 10)) break; streak++; date = new Date(date.getTime() - 86400000); } }
  if (streak >= 7) badges.push('7 Day Streak'); if (streak >= 30) badges.push('30 Day Streak');
  const exercise = await tx.exercise.findUnique({ where: { id: attempt.exerciseId }, select: { skill: true } });
  if (exercise && ['Vocabulary', 'Grammar', 'Typing'].includes(exercise.skill)) {
    const mastered = await tx.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT COUNT(DISTINCT a.exercise_id) AS count FROM student_attempts a JOIN exercises e ON e.id = a.exercise_id WHERE a.student_id = ${attempt.studentId} AND e.skill = ${exercise.skill} AND a.show_result = true AND a.needs_review = false AND a.submitted_at IS NOT NULL AND a.score >= a.total_score * 0.8`);
    if (Number(mastered[0]?.count ?? 0) >= 10) badges.push(`${exercise.skill} Master`);
  }
  await tx.studentExerciseBadge.createMany({ data: badges.map(badge => ({ studentId: attempt.studentId, badge, awardedAt: new Date() })), skipDuplicates: true });
}
