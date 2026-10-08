import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError, numberId, asJson, shuffled, attemptDto } from '@/lib/exercises/server';
import { Question } from '@/lib/exercises/contracts';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const user = await authorize(request), exerciseId = numberId((await context.params).id);
    return prisma.$transaction(async tx => {
      // Serialize starts for one learner so concurrent tabs cannot bypass attempt caps.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const exercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
      if (!exercise || exercise.status !== 'published') throw new HttpError(404, 'Bài tập chưa được xuất bản.');
      const assignment = await tx.exerciseAssignment.findUnique({ where: { exerciseId_studentId: { exerciseId, studentId: user.id } } });
      const now = new Date();
      if (assignment && (assignment.startsAt > now || assignment.endsAt <= now)) throw new HttpError(403, 'Ngoài thời gian giao bài.');
      const existing = await tx.studentAttempt.findFirst({ where: { exerciseId, studentId: user.id, submittedAt: null }, orderBy: { id: 'desc' } });
      if (existing) return attemptDto({ ...existing, exercise: { title: exercise.title } });
      if (assignment && await tx.studentAttempt.count({ where: { assignmentId: assignment.id } }) >= assignment.attemptsAllowed) throw new HttpError(403, 'Đã hết lượt làm bài.');
      let questions = exercise.questions as unknown as Question[];
      if (assignment?.randomQuestions) questions = shuffled(questions);
      questions = questions.map(q => ({ ...q, options: assignment?.randomAnswers ? shuffled(q.options) : q.options, tokens: shuffled(q.tokens) }));
      const limit = assignment?.timeLimit ?? exercise.timeLimit;
      const deadlines = [assignment?.endsAt, limit ? new Date(now.getTime() + limit * 1000) : null].filter((d): d is Date => !!d);
      const attempt = await tx.studentAttempt.create({ data: { exerciseId, studentId: user.id, assignmentId: assignment?.id, snapshot: asJson(questions), answers: {}, startedAt: now, activeSince: now, totalScore: questions.reduce((n, q) => n + q.score, 0), deadline: deadlines.length ? new Date(Math.min(...deadlines.map(d => d.getTime()))) : null, showResult: assignment?.showResult ?? true, showAnswer: assignment?.showAnswer ?? false } });
      return attemptDto({ ...attempt, exercise: { title: exercise.title } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  });
}
