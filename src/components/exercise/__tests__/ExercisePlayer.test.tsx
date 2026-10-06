import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import ExercisePlayer, { AttemptDto } from '../ExercisePlayer';
import { exerciseApi } from '../api';
const mockRouter = { replace: jest.fn() };
const replace = mockRouter.replace;
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('../api', () => ({ exerciseApi: jest.fn() }));
const api = exerciseApi as jest.Mock;
const attempt: AttemptDto = { id: 123, title: 'English', needsReview: false, typing: [], questions: [{ id: 'q1', type: 'fill_blank', prompt: 'She ___ a student.', score: 10, options: [], passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], choices: [], ignorePunctuation: true }], answers: {}, currentIndex: 0, revision: 0, startedAt: new Date().toISOString(), deadline: null, submittedAt: null, result: null, review: null };
describe('Exercise player persistence', () => {
  beforeEach(() => {
    jest.useFakeTimers(); localStorage.clear(); api.mockReset(); replace.mockReset();
    global.structuredClone = value => JSON.parse(JSON.stringify(value));
    api.mockImplementation((_url: string, method = 'GET', body?: { answers: object; currentIndex: number; revision: number }) => Promise.resolve(method === 'PUT' ? { ...attempt, answers: body!.answers, currentIndex: body!.currentIndex, revision: body!.revision + 1 } : attempt));
  });
  afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers(); });
  it('autosaves on a fixed interval even while the student keeps typing', async () => {
    await act(async () => { render(<ExercisePlayer initialAttemptId={123} />); });
    for (let i = 0; i < 10; i++) {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: `answer ${i}` } });
      await act(async () => { jest.advanceTimersByTime(200); });
    }
    expect(api.mock.calls.some(call => call[1] === 'PUT')).toBe(true);
    expect(screen.getByRole('textbox')).toHaveValue('answer 9');
  });
  it('keeps offline answers locally and recovers them after reloading', async () => {
    api.mockImplementation((_url: string, method = 'GET') => method === 'PUT' ? Promise.reject(new TypeError('Offline')) : Promise.resolve(attempt));
    let view: ReturnType<typeof render>;
    await act(async () => { view = render(<ExercisePlayer initialAttemptId={123} />); });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'is' } });
    await act(async () => { jest.advanceTimersByTime(1600); });
    expect(screen.getByText(/Chưa đồng bộ/)).toBeInTheDocument();
    view!.unmount();
    await act(async () => { render(<ExercisePlayer initialAttemptId={123} />); });
    expect(screen.getByRole('textbox')).toHaveValue('is');
  });
  it('replaces the start URL with the durable attempt URL', async () => {
    await act(async () => { render(<ExercisePlayer exerciseId={1} />); });
    expect(replace).toHaveBeenCalledWith('/exercises/attempts/123');
  });
});
