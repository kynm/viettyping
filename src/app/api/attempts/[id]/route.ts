import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError, numberId, jsonBody, asJson, attemptDto } from '@/lib/exercises/server';
import { gradeAttempt, validateAnswers } from '@/lib/exercises/engine';
import { Answers, Question } from '@/lib/exercises/contracts';
import { awardCompletion } from '@/lib/exercises/rewards';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request);
    const attempt = await prisma.studentAttempt.findFirst({ where: { id: numberId((await context.params).id), studentId: user.id }, include: { exercise: { select: { title: true } } } });
    if (!attempt) throw new HttpError(404, 'Không tìm thấy bài làm.');
    return attemptDto(attempt);
  });
}
export async function PUT(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request), id = numberId((await context.params).id), b = await jsonBody(request);
    return prisma.$transaction(async tx => {
      const attempt = await tx.studentAttempt.findFirst({ where: { id, studentId: user.id }, include: { exercise: { select: { title: true } } } });
      if (!attempt) throw new HttpError(404, 'Không tìm thấy bài làm.');
      if (attempt.submittedAt) return attemptDto(attempt);
      const questions = attempt.snapshot as unknown as Question[], expired = !!attempt.deadline && attempt.deadline <= new Date();
      let answers: Answers;
      try { answers = expired ? attempt.answers as Answers : validateAnswers(b.answers, questions); } catch (e) { throw new HttpError(400, (e as Error).message); }
      const currentIndex = Number(b.currentIndex);
      if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= questions.length || !Number.isInteger(b.revision)) throw new HttpError(400, 'Vị trí hoặc phiên bản không hợp lệ.');
      const submit = b.submit === true || expired;
      if (!expired) for (const q of questions) {
        const answer = answers[q.id];
        if (submit && q.type === 'speaking' && !answer) throw new HttpError(400, 'Cần ghi âm và lưu bài nói trước khi nộp.');
        if (q.type === 'speaking' && typeof answer === 'string' && answer) {
          const fileId = answer.replace('/api/exercises/media/', '');
          if (!await tx.exerciseMedia.findFirst({ where: { id: fileId, attemptId: id, userId: user.id } })) throw new HttpError(400, 'Ghi âm không thuộc bài làm.');
        }
        if (submit && q.type === 'writing' && typeof answer === 'string') {
          const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
          if (words < (q.minWords ?? 0) || words > (q.maxWords ?? 2000)) throw new HttpError(400, `Bài viết cần ${q.minWords ?? 0}–${q.maxWords ?? 2000} từ.`);
        }
      }
      const graded = gradeAttempt(questions, answers), submittedAt = new Date();
      const durations = { ...(attempt.questionDurations as Record<string, number>) };
      const activeId = questions[attempt.currentIndex].id;
      const elapsed = Math.max(0, (Math.min(submittedAt.getTime(), attempt.deadline?.getTime() ?? submittedAt.getTime()) - attempt.activeSince.getTime()) / 1000);
      durations[activeId] = (durations[activeId] ?? 0) + elapsed;
      const updated = await tx.studentAttempt.updateMany({ where: { id, studentId: user.id, submittedAt: null, revision: b.revision }, data: { answers: asJson(answers), currentIndex, activeSince: submittedAt, questionDurations: asJson(durations), revision: { increment: 1 }, ...(submit ? { submittedAt, score: graded.score, correct: graded.correct, needsReview: graded.needsReview } : {}) } });
      if (!updated.count) throw new HttpError(409, 'Bài làm thay đổi ở tab khác. Tải lại để đồng bộ.');
      if (submit && !graded.needsReview) {
        await awardCompletion(tx, { ...attempt, submittedAt }, graded);
      }
      return attemptDto((await tx.studentAttempt.findUnique({ where: { id }, include: { exercise: { select: { title: true } } } }))!);
    });
  });
}
