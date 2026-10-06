import { prisma } from '@/lib/prisma';
import { authorize, endpoint } from '@/lib/exercises/server';
import { Question } from '@/lib/exercises/contracts';
export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request, true), p = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(p.get('page')) || 1));
    const grade = Number(p.get('grade'));
    const where = { createdBy: user.id, status: { not: 'archived' }, ...(grade >= 1 && grade <= 9 ? { grade } : {}), ...(p.get('skill') ? { skill: p.get('skill')! } : {}), ...(p.get('difficulty') ? { difficulty: p.get('difficulty')! } : {}), ...(p.get('unit') ? { unit: p.get('unit')! } : {}), ...(p.get('lesson') ? { lesson: p.get('lesson')! } : {}) };
    const [exercises, total] = await Promise.all([prisma.exercise.findMany({ where, skip: (page - 1) * 5, take: 5, orderBy: { id: 'desc' }, select: { id: true, title: true, questions: true, grade: true, skill: true } }), prisma.exercise.count({ where })]);
    return { page, totalPages: Math.ceil(total / 5), items: exercises.flatMap(e => (e.questions as unknown as Question[]).filter(q => (!p.get('type') || q.type === p.get('type')) && (!p.get('q') || q.prompt.toLowerCase().includes(p.get('q')!.slice(0, 100).toLowerCase()))).map(q => ({ question: q, exerciseId: e.id, title: e.title, grade: e.grade, skill: e.skill }))) };
  });
}
