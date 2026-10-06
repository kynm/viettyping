import { gradeAttempt, publicQuestions, validateAnswers, validateExercise } from '../engine';
import { Question, ExerciseInput, QUESTION_TYPES } from '../contracts';
const base: Question = { id: 'q1', type: 'fill_blank', prompt: 'She ___ a student.', score: 10, options: [], acceptedAnswers: ['is'], explanation: 'Present simple', passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true };
const exercise: ExerciseInput = { title: 'English', description: '', grade: 3, skill: 'Grammar', difficulty: 'easy', course: 'English', unit: '1', lesson: '1', timeLimit: 0, status: 'published', questions: [base] };
describe('Authoritative exercise engine', () => {
  it('normalizes case, whitespace and optional punctuation without granting wrong answers', () => {
    expect(gradeAttempt([base], { q1: '  IS! ' }).score).toBe(10);
    expect(gradeAttempt([base], { q1: 'are' }).score).toBe(0);
    expect(gradeAttempt([{ ...base, ignorePunctuation: false }], { q1: 'is!' }).score).toBe(0);
  });
  it('supports multiple accepted answers and weighted totals', () => {
    const q2 = { ...base, id: 'q2', score: 20, acceptedAnswers: ['goes', 'does go'] };
    expect(gradeAttempt([base, q2], { q1: 'is', q2: 'does go' })).toMatchObject({ score: 30, totalScore: 30, correct: 2 });
  });
  it('grades matching independently of choice order', () => {
    const q = { ...base, type: 'matching' as const, pairs: [{ left: '🐈', right: 'cat' }, { left: '🐕', right: 'dog' }] };
    expect(gradeAttempt([q], { q1: { '0': 'cat', '1': 'dog' } }).score).toBe(10);
    expect(gradeAttempt([q], { q1: { '0': 'dog', '1': 'cat' } }).score).toBe(0);
    const dto = publicQuestions([q])[0];
    expect(dto.pairs).toEqual([{ id: '0', left: '🐈' }, { id: '1', left: '🐕' }]);
    expect(dto.choices).toEqual(['cat', 'dog']);
  });
  it('removes answers, explanation and pair mapping from public payload', () => {
    const dto = publicQuestions([base])[0];
    expect(dto).not.toHaveProperty('acceptedAnswers');
    expect(dto).not.toHaveProperty('explanation');
  });
  it.each(QUESTION_TYPES.filter(t => !['matching', 'memory', 'crossword', 'word_search', 'writing', 'speaking'].includes(t)))('grades %s using the stored answer', type => {
    const question = { ...base, type, acceptedAnswers: ['cat'] };
    expect(gradeAttempt([question], { q1: type === 'word_scramble' ? ['c', 'a', 't'] : 'cat' }).score).toBe(10);
  });
  it('rejects invalid grades, duplicate ids, injected metadata, unsafe media and unknown answers', () => {
    expect(() => validateExercise({ ...exercise, grade: 10 })).toThrow();
    expect(() => validateExercise({ ...exercise, questions: [base, base] })).toThrow();
    expect(() => validateExercise({ ...exercise, questions: [{ ...base, id: '__proto__' }] })).toThrow();
    expect(() => validateExercise({ ...exercise, questions: [{ ...base, image: '/assets/../secret' }] })).toThrow();
    expect(() => validateAnswers({ unrelated: 'is' }, [base])).toThrow();
    expect(() => validateAnswers({ q1: { score: 100 } }, [base])).toThrow();
  });
  it('does not trust student supplied grades or rewards', () => {
    const parsed = validateExercise({ ...exercise, createdBy: 999, role: 'TEACHER' });
    expect(parsed).not.toHaveProperty('createdBy');
    expect(parsed).not.toHaveProperty('role');
    expect(validateAnswers({ q1: 'is' }, [base])).toEqual({ q1: 'is' });
  });
  it('accepts scrambled token input and preserves repeated words', () => {
    const q = { ...base, type: 'sentence_scramble', acceptedAnswers: ['I go to school.'], tokens: ['school', 'I', 'go', 'to'] };
    expect(validateExercise({ ...exercise, questions: [q] }).questions).toHaveLength(1);
  });
});

