import { prisma } from '@/lib/prisma';
import { authorize, endpoint, jsonBody, HttpError, asJson } from '@/lib/exercises/server';
import { validateExercise } from '@/lib/exercises/engine';
import { Prisma } from '@prisma/client';
import { validateQuestionMedia } from '@/lib/exercises/media';

export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request);
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10000, Number(params.get('page')) || 1));
    const teacher = params.get('teacher') === '1';
    if (teacher && user.role !== 'TEACHER') throw new HttpError(403, 'Không có quyền.');
    const grade = Number(params.get('grade'));
    const state = params.get('state') ?? 'all';
    const where: Prisma.ExerciseWhereInput = { ...(teacher ? { createdBy: user.id, status: { not: 'archived' } } : { status: 'published' }), ...(grade >= 1 && grade <= 9 ? { grade } : {}), ...(params.get('skill') ? { skill: params.get('skill')! } : {}), ...(params.get('q') ? { title: { contains: params.get('q')!.slice(0, 100) } } : {}) };
    if (!teacher) {
      if (state === 'assigned') where.assignments = { some: { studentId: user.id } };
      if (state === 'completed' || state === 'in_progress') { delete where.status; where.attempts = { some: { studentId: user.id, submittedAt: state === 'completed' ? { not: null } : null } }; }
    }
    const [items, total] = await Promise.all([prisma.exercise.findMany({ where, skip: (page - 1) * 20, take: 20, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, description: true, grade: true, skill: true, difficulty: true, status: true, unit: true, lesson: true, timeLimit: true, version: true } }), prisma.exercise.count({ where })]);
    const attempts = (await Promise.all(items.map(e => prisma.studentAttempt.findFirst({ where: { studentId: user.id, exerciseId: e.id, ...(state === 'completed' ? { submittedAt: { not: null } } : state === 'in_progress' ? { submittedAt: null } : {}) }, orderBy: { id: 'desc' }, select: { id: true, exerciseId: true, submittedAt: true, currentIndex: true, score: true, totalScore: true, showResult: true, needsReview: true } })))).filter((a): a is NonNullable<typeof a> => a !== null);
    const assignments = await prisma.exerciseAssignment.findMany({ where: { studentId: user.id, exerciseId: { in: items.map(e => e.id) } }, select: { exerciseId: true, startsAt: true, endsAt: true } });
    return { role: user.role, items: items.map(e => ({ ...e, attempt: attempts.find(a => a.exerciseId === e.id) ? (() => { const a = attempts.find(a => a.exerciseId === e.id)!; return { id: a.id, submittedAt: a.submittedAt, currentIndex: a.currentIndex, score: a.showResult && !a.needsReview ? a.score : null, totalScore: a.showResult && !a.needsReview ? a.totalScore : null }; })() : null, assignment: assignments.find(a => a.exerciseId === e.id) ?? null })), total, page };
  });
}
export async function POST(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request, true);
    let data;
    try { data = validateExercise(await jsonBody(request)); } catch (e) { throw new HttpError(400, (e as Error).message); }
    await validateQuestionMedia(data.questions, user.id);
    const exercise = await prisma.exercise.create({ data: { ...data, questions: asJson(data.questions), createdBy: user.id } });
    return { id: exercise.id };
  });
}

