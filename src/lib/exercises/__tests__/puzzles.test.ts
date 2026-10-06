import { generateWordSearch, generateCrossword } from '../puzzles';
import { gradeAttempt, publicQuestions, validateExercise } from '../engine';
import { Question } from '../contracts';
const q: Question = { id: 'puzzle', type: 'word_search', prompt: 'Find words', score: 10, options: [], acceptedAnswers: ['CAT', 'DOG', 'BIRD'], explanation: '', passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true };
describe('Advanced exercise grading and generators', () => {
  it('places every vocabulary word on horizontal, vertical or diagonal cells', () => {
    const puzzle = generateWordSearch(['CAT', 'DOG', 'BIRD']);
    expect(puzzle.entries).toHaveLength(3);
    for (const e of puzzle.entries) expect([...e.word].map((_, i) => puzzle.grid[e.row + (e.direction === 'across' ? 0 : i)][e.col + (e.direction === 'down' ? 0 : i)]).join('')).toBe(e.word);
    const paths = puzzle.entries.map(e => [...e.word].map((_, i) => `${e.row + (e.direction === 'across' ? 0 : i)},${e.col + (e.direction === 'down' ? 0 : i)}`).join(';'));
    expect(gradeAttempt([{ ...q, puzzle }], { puzzle: paths }).score).toBe(10);
    expect(publicQuestions([{ ...q, puzzle }])[0].clues).toBeUndefined();
    expect(gradeAttempt([{ ...q, puzzle }], { puzzle: ['CAT', 'DOG', 'BIRD'] }).score).toBe(0);
    expect(gradeAttempt([{ ...q, puzzle }], { puzzle: ['CAT'] }).score).toBe(0);
  });
  it('generates crossword clues without exposing filled cells to students', () => {
    const pairs = [{ left: 'A pet that meows', right: 'CAT' }, { left: 'A road vehicle', right: 'CAR' }, { left: 'The opposite of cold', right: 'HOT' }];
    const puzzle = generateCrossword(pairs), question = { ...q, type: 'crossword' as const, puzzle, pairs };
    const answers: Record<string, string> = {};
    puzzle.grid.forEach((row, r) => row.forEach((c, col) => { if (c) answers[`${r}_${col}`] = c; }));
    expect(puzzle.entries).toHaveLength(3);
    expect(gradeAttempt([question], { puzzle: answers }).score).toBe(10);
    const dto = publicQuestions([question])[0];
    expect(dto.grid?.flat().every(c => ['', '_'].includes(c))).toBe(true);
    expect(dto.choices).toEqual([]);
    expect(dto.clues).toHaveLength(3);
  });
  it('keeps writing and speaking pending until an authorized teacher supplies grades', () => {
    const writing = { ...q, type: 'writing' as const, acceptedAnswers: [], minWords: 5, maxWords: 80 };
    const speaking = { ...q, id: 'speech', type: 'speaking' as const, acceptedAnswers: [] };
    expect(gradeAttempt([writing, speaking], { puzzle: 'My family is kind and happy.', speech: '/audio' })).toMatchObject({ needsReview: true, score: 0 });
    expect(gradeAttempt([writing, speaking], {}, { puzzle: { score: 8, feedback: 'Well done' }, speech: { score: 10, feedback: 'Clear pronunciation' } })).toMatchObject({ needsReview: false, score: 18 });
  });
  it('requires generated/uploaded audio for published listening and hides transcript', () => {
    const exercise = { title: 'Listening', description: '', grade: 3, skill: 'Listening', difficulty: 'easy', course: 'English', unit: '', lesson: '', timeLimit: 0, status: 'published', questions: [{ ...q, type: 'listen_type', acceptedAnswers: ['SECRET'], speechText: 'SECRET' }] };
    expect(() => validateExercise(exercise)).toThrow(/audio/);
    expect(JSON.stringify(publicQuestions([{ ...q, type: 'listen_type', speechText: 'SECRET', audio: '/assets/example.wav' }]))).not.toContain('SECRET');
    const publicDictation = publicQuestions([{ ...q, type: 'listen_type', speechText: 'SECRET', passage: 'SECRET', tokens: ['SECRET'], options: ['SECRET'], pairs: [{ left: 'SECRET', right: 'SECRET' }], audio: '/assets/example.wav' }])[0];
    expect(JSON.stringify(publicDictation)).not.toContain('SECRET');
  });
});
