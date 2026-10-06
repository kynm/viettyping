import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Question, SKILLS } from '@/lib/exercises/contracts';
import { authorize, endpoint, jsonBody, HttpError, asJson, attemptDto, shuffled } from '@/lib/exercises/server';
export async function POST(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request), b = await jsonBody(request), grade = Number(b.grade), count = b.daily === true ? 10 : Number(b.count);
    if (!Number.isInteger(grade) || grade < 1 || grade > 9 || !Number.isInteger(count) || count < 1 || count > 30 || !SKILLS.includes(b.skill) || !['easy', 'medium', 'hard'].includes(b.difficulty)) throw new HttpError(400, 'Bộ lọc tự luyện không hợp lệ.');
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const now = new Date(), dayStart = new Date(new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10) + 'T00:00:00+07:00');
      if (b.daily === true) {
        const existing = await tx.studentAttempt.findFirst({ where: { studentId: user.id, mode: 'daily', startedAt: { gte: dayStart } }, orderBy: { id: 'desc' }, include: { exercise: { select: { title: true } } } });
        if (existing) return attemptDto(existing);
      }
      const where = { status: 'published', grade, skill: String(b.skill), difficulty: String(b.difficulty), ...(b.unit ? { unit: String(b.unit).slice(0, 120) } : {}), assignments: { none: { studentId: user.id } } };
      const total = await tx.exercise.count({ where });
      if (!total) throw new HttpError(404, 'Chưa có bài tự luyện phù hợp. Hãy chọn bộ lọc khác.');
      const exercise = (await tx.exercise.findMany({ where, orderBy: { id: 'asc' }, skip: Math.floor(Math.random() * total), take: 1 }))[0];
      const questions = shuffled(exercise.questions as unknown as Question[]).slice(0, count).map(q => ({ ...q, options: shuffled(q.options), tokens: shuffled(q.tokens) }));
      const mode = b.daily === true ? 'daily' : 'practice', label = b.daily === true ? 'Daily Practice' : 'Tự luyện tiếng Anh';
      const attempt = await tx.studentAttempt.create({ data: { studentId: user.id, exerciseId: exercise.id, mode, label, snapshot: asJson(questions), answers: {}, startedAt: now, activeSince: now, totalScore: questions.reduce((n, q) => n + q.score, 0), showAnswer: true, showResult: true } });
      return attemptDto({ ...attempt, exercise: { title: label } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  });
}
