'use client';
import { useState } from 'react';
import { parseQuestionCsv } from '@/lib/exercises/csv';
import { Question } from '@/lib/exercises/contracts';
import { ExerciseButton, fieldClass } from './controls';
export default function QuestionImport({ onImport }: { onImport: (questions: Question[]) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]), [error, setError] = useState('');
  return <section className="min-w-0 grid gap-3 rounded-xl border p-4"><h3 className="font-bold">Import Excel / CSV</h3><p>Question,A,B,C,D,Correct,Explanation. Correct có thể là A–D hoặc nội dung đáp án.</p><input aria-label="Chọn CSV" className={fieldClass} type="file" accept=".csv,.xlsx" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.name.toLowerCase().endsWith('.xlsx')) { const form = new FormData(); form.set('file', file); void fetch('/api/exercises/import', { method: 'POST', body: form }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setQuestions(d.questions); setError(''); }).catch(e => { setError(e.message); setQuestions([]); }); return; } if (file.size > 500000 || !file.name.toLowerCase().endsWith('.csv')) { setError('Chọn tệp CSV dưới 500KB.'); return; } void file.text().then(s => { try { setQuestions(parseQuestionCsv(s)); setError(''); } catch (e) { setError((e as Error).message); setQuestions([]); } }); }} />{error && <p role="alert">{error}</p>}{questions.length > 0 && <><div className="max-h-64 overflow-auto">{questions.map(q => <p key={q.id}>{q.prompt} → {q.acceptedAnswers[0]}</p>)}</div><ExerciseButton onClick={() => { onImport(questions); setQuestions([]); }}>Xác nhận thêm {questions.length} câu hỏi</ExerciseButton></>}</section>;
}
