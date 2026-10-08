export const QUESTION_TYPES = ['multiple_choice', 'fill_blank', 'matching', 'drag_drop', 'missing_letters', 'word_scramble', 'sentence_scramble', 'odd_one_out', 'true_false', 'word_search', 'crossword', 'memory', 'listen_choose', 'listen_type', 'read_choose', 'error_correction', 'sentence_transformation', 'writing', 'speaking', 'typing', 'typing_race'] as const;
export type QuestionType = typeof QUESTION_TYPES[number];
export const SKILLS = ['Vocabulary', 'Grammar', 'Reading', 'Listening', 'Writing', 'Speaking', 'Typing'] as const;
export interface Question {
  id: string; type: QuestionType; prompt: string; score: number;
  options: string[]; acceptedAnswers: string[]; explanation: string;
  passage: string; image: string; audio: string; speechText: string;
  tokens: string[]; pairs: { left: string; right: string }[];
  ignorePunctuation: boolean;
  minWords?: number; maxWords?: number;
  puzzle?: { grid: string[][]; entries: { word: string; clue: string; row: number; col: number; direction: 'across' | 'down' | 'diagonal' }[] };
}
export type PublicQuestion = Omit<Question, 'acceptedAnswers' | 'explanation' | 'pairs' | 'puzzle'> & { pairs: { id: string; left: string }[]; choices: string[]; grid?: string[][]; clues?: { id: string; clue: string; row: number; col: number; direction: 'across' | 'down' | 'diagonal'; length: number }[] };
export type Answers = Record<string, string | string[] | Record<string, string>>;
export interface ExerciseInput {
  title: string; description: string; grade: number; skill: string;
  difficulty: string; course: string; unit: string; lesson: string;
  timeLimit: number; status: string; questions: Question[];
  leaderboardEnabled?: boolean;
}
export function emptyQuestion(type: QuestionType = 'multiple_choice'): Question {
  return { id: crypto.randomUUID(), type, prompt: '', score: 10, options: [], acceptedAnswers: [], explanation: '', passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true };
}
