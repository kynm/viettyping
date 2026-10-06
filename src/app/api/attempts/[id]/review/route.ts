import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError, numberId, jsonBody, asJson } from '@/lib/exercises/server';
import { Question, Answers } from '@/lib/exercises/contracts';
import { gradeAttempt } from '@/lib/exercises/engine';
import { awardCompletion } from '@/lib/exercises/rewards';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true);
    const attempt = await prisma.studentAttempt.findFirst({ where: { id: numberId((await context.params).id), exercise: { createdBy: user.id }, submittedAt: { not: null } }, select: { id: true, snapshot: true, answers: true, manualGrades: true, revision: true, needsReview: true } });
    if (!attempt) throw new HttpError(404, 'Không tìm thấy bài đã nộp.');
    return attempt;
  });
}
export async function PUT(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true), id = numberId((await context.params).id), b = await jsonBody(request);
    return prisma.$transaction(async tx => {
      const attempt = await tx.studentAttempt.findFirst({ where: { id, exercise: { createdBy: user.id }, submittedAt: { not: null } } });
      if (!attempt) throw new HttpError(404, 'Không tìm thấy bài đã nộp.');
      const questions = attempt.snapshot as unknown as Question[], grades: Record<string, { score: number; feedback: string }> = {};
      if (!b.manualGrades || typeof b.manualGrades !== 'object' || Array.isArray(b.manualGrades)) throw new HttpError(400, 'Điểm chấm không hợp lệ.');
      for (const [key, value] of Object.entries(b.manualGrades)) {
        const q = questions.find(q => q.id === key);
        const g = value as { score: unknown; feedback: unknown };
        if (!q || !['writing', 'speaking'].includes(q.type) || !g || typeof g.score !== 'number' || !Number.isFinite(g.score) || g.score < 0 || g.score > q.score || typeof g.feedback !== 'string' || g.feedback.length > 5000) throw new HttpError(400, 'Điểm hoặc nhận xét không hợp lệ.');
        grades[key] = { score: g.score, feedback: g.feedback };
      }
      const graded = gradeAttempt(questions, attempt.answers as Answers, grades);
      const updated = await tx.studentAttempt.updateMany({ where: { id, revision: Number(b.revision) }, data: { manualGrades: asJson(grades), needsReview: graded.needsReview, score: graded.score, correct: graded.correct, revision: { increment: 1 } } });
      if (!updated.count) throw new HttpError(409, 'Giáo viên khác hoặc tab khác đã chấm bài. Tải lại.');
      if (!graded.needsReview) {
        await awardCompletion(tx, attempt, graded);
      }
      return { ok: true, revision: attempt.revision + 1, needsReview: graded.needsReview };
    });
  });
}
