import { Answers, ExerciseInput, PublicQuestion, Question, QUESTION_TYPES, SKILLS } from './contracts';
import { generateCrossword, generateWordSearch, wordAtPath } from './puzzles';

const choiceTypes = new Set(['multiple_choice', 'odd_one_out', 'true_false', 'listen_choose', 'read_choose', 'drag_drop']);
function text(value: unknown, max = 5000): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Văn bản không hợp lệ.');
  return value.trim();
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Danh sách không hợp lệ.');
  return value.map(v => text(v, 1000));
}
function media(value: unknown) {
  const path = text(value ?? '', 500);
  if (path && !/^\/assets\/[a-zA-Z0-9_./-]+$/.test(path) && !/^\/api\/exercises\/media\/[a-f0-9-]{36}\.(png|jpg|webp|mp3|wav)$/.test(path)) throw new Error('Đường dẫn media không hợp lệ.');
  if (path.includes('..')) throw new Error('Đường dẫn không hợp lệ.');
  return path;
}
export function validateExercise(value: unknown): ExerciseInput {
  if (!value || typeof value !== 'object') throw new Error('Bài tập không hợp lệ.');
  const v = value as Record<string, unknown>;
  const grade = Number(v.grade), timeLimit = Number(v.timeLimit);
  if (!Number.isInteger(grade) || grade < 1 || grade > 9 || !Number.isInteger(timeLimit) || timeLimit < 0 || timeLimit > 7200) throw new Error('Khối lớp hoặc thời gian không hợp lệ.');
  if (!SKILLS.includes(v.skill as typeof SKILLS[number]) || !['easy', 'medium', 'hard'].includes(String(v.difficulty)) || !['draft', 'published', 'archived'].includes(String(v.status))) throw new Error('Phân loại không hợp lệ.');
  if (!Array.isArray(v.questions) || v.questions.length < 1 || v.questions.length > 100) throw new Error('Cần 1–100 câu hỏi.');
  const ids = new Set<string>();
  const questions = v.questions.map(raw => {
    if (!raw || typeof raw !== 'object') throw new Error('Câu hỏi không hợp lệ.');
    const q = raw as Record<string, unknown>;
    const id = text(q.id, 80), type = q.type as Question['type'], score = Number(q.score);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || ids.has(id) || !QUESTION_TYPES.includes(type) || !Number.isFinite(score) || score < 1 || score > 100) throw new Error('ID, loại hoặc điểm câu hỏi không hợp lệ.');
    ids.add(id);
    const options = strings(q.options ?? []), acceptedAnswers = strings(q.acceptedAnswers ?? []), tokens = strings(q.tokens ?? []);
    const prompt = text(q.prompt);
    if (!prompt) throw new Error('Cần nội dung câu hỏi.');
    const pairs = Array.isArray(q.pairs) ? q.pairs.map(p => ({ left: text(p.left, 500).startsWith('/') ? media(p.left) : text(p.left, 500), right: text(p.right, 500) })) : [];
    if (['matching', 'memory', 'crossword'].includes(type)) {
      if (pairs.length < 2 || pairs.length > 20 || pairs.some(p => !p.left || !p.right) || new Set(pairs.map(p => p.right)).size !== pairs.length) throw new Error('Cần 2–20 cặp có đáp án riêng biệt.');
    } else if (!['writing', 'speaking'].includes(type) && (!acceptedAnswers.length || acceptedAnswers.some(a => !a))) throw new Error('Cần đáp án được chấp nhận.');
    if (choiceTypes.has(type) && (options.length < 2 || options.length > 8 || options.some(o => !o) || new Set(options).size !== options.length || acceptedAnswers.some(a => !options.includes(a)))) throw new Error('Đáp án phải thuộc 2–8 lựa chọn riêng biệt.');
    if (type === 'fill_blank' && options.length && (options.length < 2 || options.length > 8 || new Set(options).size !== options.length || acceptedAnswers.some(a => !options.some(o => normalize(o, true) === normalize(a, true))))) throw new Error('Điền từ dạng dropdown cần 2–8 lựa chọn gồm đáp án đúng.');
    if (['word_scramble', 'sentence_scramble'].includes(type)) {
      const separator = type === 'word_scramble' ? '' : ' ';
      if (tokens.length < 2 || !acceptedAnswers.some(a => normalize(a, true).split(separator).sort().join('|') === normalize(tokens.join(separator), true).split(separator).sort().join('|'))) throw new Error('Các mảnh từ phải tạo được đáp án.');
    }
    const speechText = text(q.speechText ?? '', 2000), audio = media(q.audio);
    if (['listen_choose', 'listen_type'].includes(type) && !speechText && !audio) throw new Error('Câu nghe cần audio hoặc văn bản đọc.');
    if (v.status === 'published' && ['listen_choose', 'listen_type'].includes(type) && !audio) throw new Error('Tạo hoặc upload audio trước khi xuất bản câu nghe.');
    if (type === 'read_choose' && !text(q.passage ?? '')) throw new Error('Câu đọc cần đoạn văn.');
    if (['typing', 'typing_race'].includes(type) && !acceptedAnswers.some(a => normalize(a, q.ignorePunctuation === true) === normalize(text(q.passage || q.prompt), q.ignorePunctuation === true))) throw new Error('Đáp án luyện gõ phải khớp đoạn mẫu (Passage).');
    const minWords = Number(q.minWords ?? 0), maxWords = Number(q.maxWords ?? 1000);
    if (!Number.isInteger(minWords) || !Number.isInteger(maxWords) || minWords < 0 || maxWords < Math.max(1, minWords) || maxWords > 2000) throw new Error('Giới hạn số từ không hợp lệ.');
    let puzzle: Question['puzzle'];
    if (type === 'word_search') {
      const words = acceptedAnswers.map(a => a.toUpperCase());
      if (words.length > 10 || words.some(w => !/^[A-Z]{2,15}$/.test(w)) || new Set(words).size !== words.length) throw new Error('Tìm từ cần 1–10 từ tiếng Anh, mỗi từ 2–15 chữ.');
      let seed = [...id].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
      puzzle = generateWordSearch(words, () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; });
    }
    if (type === 'crossword') {
      if (pairs.some(p => !/^[a-zA-Z]{2,15}$/.test(p.right))) throw new Error('Ô chữ cần từ tiếng Anh gồm 2–15 chữ.');
      puzzle = generateCrossword(pairs);
    }
    return { id, type, prompt, score, options, acceptedAnswers, tokens, pairs, explanation: text(q.explanation ?? ''), passage: text(q.passage ?? ''), image: media(q.image), audio, speechText, ignorePunctuation: q.ignorePunctuation === true, minWords, maxWords, ...(puzzle ? { puzzle } : {}) };
  });
  const title = text(v.title, 200);
  if (!title) throw new Error('Cần tên bài tập.');
  return { title, description: text(v.description ?? ''), grade, skill: String(v.skill), difficulty: String(v.difficulty), course: text(v.course ?? 'English', 120), unit: text(v.unit ?? '', 120), lesson: text(v.lesson ?? '', 120), timeLimit, status: String(v.status), questions, leaderboardEnabled: v.leaderboardEnabled === true };
}
export function normalize(value: string, ignorePunctuation: boolean) {
  const normalized = value.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
  return ignorePunctuation ? normalized.replace(/[\p{P}\p{S}]/gu, '').trim() : normalized;
}
export function publicQuestions(questions: Question[]): PublicQuestion[] {
  return questions.map(q => ({ id: q.id, type: q.type, prompt: q.prompt, score: q.score, options: choiceTypes.has(q.type) || q.type === 'fill_blank' ? q.options : [], passage: ['listen_choose', 'listen_type'].includes(q.type) ? '' : q.passage, image: q.image, audio: q.audio, speechText: '', tokens: ['word_scramble', 'sentence_scramble'].includes(q.type) ? q.tokens : [], ignorePunctuation: q.ignorePunctuation, minWords: q.minWords, maxWords: q.maxWords, pairs: !['matching', 'memory'].includes(q.type) ? [] : q.pairs.map((p, i) => ({ id: String(i), left: p.left })), choices: q.type === 'word_search' ? q.acceptedAnswers.map(a => a.toUpperCase()).sort() : !['matching', 'memory'].includes(q.type) ? [] : q.pairs.map(p => p.right).sort(), ...(q.puzzle ? { grid: q.type === 'crossword' ? q.puzzle.grid.map(row => row.map(c => c ? '_' : '')) : q.puzzle.grid, clues: q.type === 'crossword' ? q.puzzle.entries.map((e, i) => ({ id: String(i), clue: e.clue, row: e.row, col: e.col, direction: e.direction, length: e.word.length })) : undefined } : {}) }));
}
export function validateAnswers(value: unknown, questions: Question[]): Answers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Câu trả lời không hợp lệ.');
  const result: Answers = {};
  for (const [id, answer] of Object.entries(value)) {
    const q = questions.find(q => q.id === id);
    if (!q) throw new Error('Câu hỏi không thuộc bài làm.');
    if (['matching', 'memory', 'crossword'].includes(q.type)) {
      if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw new Error('Cặp ghép không hợp lệ.');
      const pairs: Record<string, string> = {};
      for (const [key, val] of Object.entries(answer)) {
        if (q.type === 'crossword' ? !/^\d+_\d+$/.test(key) || !q.puzzle?.grid[Number(key.split('_')[0])]?.[Number(key.split('_')[1])] : !/^\d+$/.test(key) || Number(key) >= q.pairs.length) throw new Error('Cặp ghép không hợp lệ.');
        pairs[key] = text(val, 1000);
      }
      result[id] = pairs;
    } else if (Array.isArray(answer) && ['word_scramble', 'sentence_scramble', 'word_search'].includes(q.type)) result[id] = strings(answer);
    else result[id] = text(answer, 10000);
  }
  return result;
}
export function gradeAttempt(questions: Question[], answers: Answers, manualGrades: Record<string, { score: number; feedback: string }> = {}) {
  const details = questions.map(q => {
    const a = answers[q.id];
    const selectedWords = q.type === 'word_search' && Array.isArray(a) && q.puzzle ? a.map(path => {
      const word = wordAtPath(q.puzzle!.grid, path), reverse = [...word].reverse().join('');
      return q.acceptedAnswers.some(w => w.toUpperCase() === word) ? word : q.acceptedAnswers.some(w => w.toUpperCase() === reverse) ? reverse : '';
    }) : [];
    const submitted = Array.isArray(a) ? a.join(q.type === 'word_scramble' ? '' : ' ') : typeof a === 'string' ? a : '';
    const manual = ['writing', 'speaking'].includes(q.type), pending = manual && !manualGrades[q.id];
    const correct = manual ? manualGrades[q.id]?.score === q.score : ['matching', 'memory'].includes(q.type) ? !!a && typeof a === 'object' && !Array.isArray(a) && q.pairs.every((p, i) => a[String(i)] === p.right) : q.type === 'crossword' ? !!a && typeof a === 'object' && !Array.isArray(a) && !!q.puzzle && q.puzzle.grid.every((row, r) => row.every((c, col) => !c || String(a[`${r}_${col}`] ?? '').toUpperCase() === c)) : q.type === 'word_search' ? Array.isArray(a) && selectedWords.every(Boolean) && q.acceptedAnswers.every(w => selectedWords.includes(w.toUpperCase())) && new Set(selectedWords).size === q.acceptedAnswers.length : q.acceptedAnswers.some(expected => normalize(expected, q.ignorePunctuation) === normalize(submitted, q.ignorePunctuation));
    return { id: q.id, correct, pending, score: manual ? manualGrades[q.id]?.score ?? 0 : correct ? q.score : 0, studentAnswer: q.type === 'word_search' ? selectedWords.filter(Boolean) : a ?? '', correctAnswer: ['matching', 'memory', 'crossword'].includes(q.type) ? q.pairs : q.acceptedAnswers, explanation: manual ? manualGrades[q.id]?.feedback ?? '' : q.explanation };
  });
  return { score: details.reduce((n, d) => n + d.score, 0), totalScore: questions.reduce((n, q) => n + q.score, 0), correct: details.filter(d => d.correct).length, needsReview: details.some(d => d.pending), details };
}


