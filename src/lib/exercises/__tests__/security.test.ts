/** @jest-environment node */
import { authorize, attemptDto, HttpError } from '../server';
import { getCurrentUser } from '@/lib/auth';
jest.mock('@/lib/auth', () => ({ getCurrentUser: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {} }));
const mockedUser = getCurrentUser as jest.Mock;
describe('Exercise access and result visibility', () => {
  beforeEach(() => mockedUser.mockReset());
  it('requires an authenticated session', async () => {
    mockedUser.mockResolvedValue(null);
    await expect(authorize(new Request('https://school.test/api/exercises'))).rejects.toMatchObject({ status: 401 });
  });
  it('rejects student access to teacher operations', async () => {
    mockedUser.mockResolvedValue({ id: 1, role: 'STUDENT' });
    await expect(authorize(new Request('https://school.test/api/exercises'), true)).rejects.toMatchObject({ status: 403 });
  });
  it('rejects cross-origin and missing-origin writes', async () => {
    await expect(authorize(new Request('https://school.test/api/exercises', { method: 'POST', headers: { origin: 'https://evil.test' } }))).rejects.toBeInstanceOf(HttpError);
    await expect(authorize(new Request('https://school.test/api/exercises', { method: 'POST' }))).rejects.toBeInstanceOf(HttpError);
  });
  it('allows a teacher with same-origin session', async () => {
    mockedUser.mockResolvedValue({ id: 1, role: 'TEACHER' });
    await expect(authorize(new Request('https://school.test/api/exercises', { method: 'POST', headers: { origin: 'https://school.test' } }), true)).resolves.toMatchObject({ id: 1 });
  });
  it('never exposes review before submission or while hidden', () => {
    const q = { id: 'q1', type: 'fill_blank', prompt: 'Question', score: 10, options: [], acceptedAnswers: ['SECRET'], explanation: 'SECRET explanation', passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true };
    const a = { id: 1, snapshot: [q], answers: {}, currentIndex: 0, revision: 0, startedAt: new Date(), deadline: null, submittedAt: null, score: null, totalScore: 10, correct: 0, showResult: true, showAnswer: true };
    expect(JSON.stringify(attemptDto(a))).not.toContain('SECRET');
    expect(attemptDto({ ...a, submittedAt: new Date(), showResult: false, showAnswer: false })).toMatchObject({ result: null, review: null });
    expect(JSON.stringify(attemptDto({ ...a, submittedAt: new Date() }))).toContain('SECRET');
  });
});
