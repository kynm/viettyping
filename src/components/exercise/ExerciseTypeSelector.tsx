'use client';
import { QuestionType, QUESTION_TYPES } from '@/lib/exercises/contracts';
import { ExerciseButton } from './controls';
const labels: Record<QuestionType, string> = { multiple_choice: 'Trắc nghiệm', fill_blank: 'Điền từ', matching: 'Ghép hình / từ', drag_drop: 'Kéo thả', missing_letters: 'Chữ còn thiếu', word_scramble: 'Sắp xếp chữ', sentence_scramble: 'Sắp xếp câu', odd_one_out: 'Từ khác nhóm', true_false: 'Đúng / Sai', word_search: 'Tìm từ', crossword: 'Ô chữ', memory: 'Lật thẻ', listen_choose: 'Nghe và chọn', listen_type: 'Nghe và nhập', read_choose: 'Đọc và chọn', error_correction: 'Sửa lỗi', sentence_transformation: 'Viết lại câu', writing: 'Viết đoạn văn', speaking: 'Ghi âm bài nói', typing: 'Luyện gõ', typing_race: 'Đua gõ phím' };
export default function ExerciseTypeSelector({ selected, onSelect }: { selected: QuestionType; onSelect: (type: QuestionType) => void }) {
  return <details className="rounded-2xl border-2 border-sky-200 p-4"><summary className="min-h-12 cursor-pointer font-bold">1. Chọn dạng bài · {labels[selected]}</summary><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{QUESTION_TYPES.map(t => <ExerciseButton key={t} aria-pressed={selected === t} onClick={() => onSelect(t)}>{labels[t]}</ExerciseButton>)}</div></details>;
}
