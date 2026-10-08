import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { Answers, Question } from './contracts';
import { gradeAttempt, publicQuestions } from './engine';
import { isSameOrigin } from '@/lib/request-origin';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function authorize(request: Request, teacher = false) {
  if (request.method !== 'GET') {
    if (!isSameOrigin(request)) throw new HttpError(403, 'Nguồn yêu cầu không hợp lệ.');
  }
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Vui lòng đăng nhập.');
  if (teacher && user.role !== 'TEACHER') throw new HttpError(403, 'Chỉ giáo viên được thực hiện thao tác này.');
  return user;
}
export async function jsonBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 500_000) throw new HttpError(413, 'Dữ liệu quá lớn.');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
    return value;
  } catch { throw new HttpError(400, 'JSON không hợp lệ.'); }
}
export async function endpoint(fn: () => Promise<unknown>) {
  try { return NextResponse.json(await fn(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Có thay đổi đồng thời. Vui lòng thử lại.' }, { status: 409 });
    console.error('[exercise API]', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Không thể xử lý bài tập. Vui lòng thử lại.' }, { status: 500 });
  }
}
export const asJson = (value: unknown) => value as Prisma.InputJsonValue;
export function numberId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'ID không hợp lệ.');
  return id;
}
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function attemptDto(attempt: { id: number; questionDurations?: unknown; label?: string; needsReview?: boolean; manualGrades?: unknown; exercise?: { title: string }; snapshot: unknown; answers: unknown; currentIndex: number; revision: number; startedAt: Date; deadline: Date | null; submittedAt: Date | null; score: number | null; totalScore: number; correct: number; showResult: boolean; showAnswer: boolean }) {
  const questions = attempt.snapshot as Question[];
  const done = !!attempt.submittedAt;
  const typing = done && attempt.showResult ? questions.filter(q => ['typing', 'typing_race'].includes(q.type)).map(q => {
    const answer = String((attempt.answers as Answers)[q.id] ?? ''), target = q.passage || q.prompt, duration = Math.max(1, (attempt.questionDurations as Record<string, number> | undefined)?.[q.id] ?? 1);
    const errors = [...answer].filter((c, i) => c !== [...target][i]).length + Math.max(0, [...target].length - [...answer].length);
    return { id: q.id, duration: Math.round(duration), errors, accuracy: Math.max(0, Math.round(100 * (1 - errors / Math.max([...target].length, [...answer].length, 1)))), wpm: Math.round([...answer].length / 5 / (duration / 60)) };
  }) : [];
  const result = done && attempt.showResult ? { score: attempt.score, totalScore: attempt.totalScore, correct: attempt.correct, incorrect: questions.length - attempt.correct, accuracy: Math.round((attempt.score ?? 0) / attempt.totalScore * 100), seconds: Math.round((attempt.submittedAt!.getTime() - attempt.startedAt.getTime()) / 1000) } : null;
  return { id: attempt.id, typing, needsReview: attempt.needsReview ?? false, title: attempt.label || attempt.exercise?.title || 'Bài tập tiếng Anh', questions: publicQuestions(questions), answers: attempt.answers, currentIndex: attempt.currentIndex, revision: attempt.revision, startedAt: attempt.startedAt, deadline: attempt.deadline, submittedAt: attempt.submittedAt, result: attempt.needsReview ? null : result, review: done && attempt.showAnswer ? gradeAttempt(questions, attempt.answers as Answers, (attempt.manualGrades ?? {}) as Record<string, { score: number; feedback: string }>).details : null };
}


