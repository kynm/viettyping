'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SKILLS } from '@/lib/exercises/contracts';
import { exerciseApi } from './api';
import { ExerciseButton, ExerciseInput, fieldClass } from './controls';
export default function PracticeForm() {
  const router = useRouter(), [data, setData] = useState({ grade: 3, skill: 'Vocabulary', difficulty: 'easy', unit: '', count: 10 }), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function start(daily: boolean) { setBusy(true); try { const a = await exerciseApi<{ id: number }>('/api/exercises/practice', 'POST', { ...data, daily }); router.push(`/exercises/attempts/${a.id}`); } catch (e) { setError((e as Error).message); setBusy(false); } }
  return <section className="min-w-0 grid gap-4 rounded-3xl border bg-amber-50 p-5"><h2 className="text-2xl font-bold">Luyện tập mỗi ngày</h2><p>Chọn chủ đề em thích. Daily Practice: tối đa 10 câu và thưởng thêm 10 XP khi hoàn thành.</p><div className="min-w-0 grid gap-3 sm:grid-cols-3"><ExerciseInput label="Khối lớp" type="number" min={1} max={9} value={data.grade} onChange={e => setData({ ...data, grade: Number(e.target.value) })} /><label>Kỹ năng<select className={fieldClass} value={data.skill} onChange={e => setData({ ...data, skill: e.target.value })}>{SKILLS.map(s => <option key={s}>{s}</option>)}</select></label><label>Độ khó<select className={fieldClass} value={data.difficulty} onChange={e => setData({ ...data, difficulty: e.target.value })}>{['easy', 'medium', 'hard'].map(s => <option key={s}>{s}</option>)}</select></label><ExerciseInput label="Unit (tùy chọn)" value={data.unit} onChange={e => setData({ ...data, unit: e.target.value })} /><ExerciseInput label="Số câu (1–30)" type="number" min={1} max={30} value={data.count} onChange={e => setData({ ...data, count: Number(e.target.value) })} /></div><div className="flex flex-wrap gap-3"><ExerciseButton disabled={busy} onClick={() => void start(false)}>Tự luyện</ExerciseButton><ExerciseButton disabled={busy} onClick={() => void start(true)}>Daily Practice →</ExerciseButton></div>{error && <p role="alert">{error}</p>}</section>;
}
