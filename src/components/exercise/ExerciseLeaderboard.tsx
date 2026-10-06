'use client';
import { useEffect, useState } from 'react';
import { exerciseApi } from './api';
import { ExerciseInput, fieldClass } from './controls';
export default function ExerciseLeaderboard() {
  const [classId, setClassId] = useState(''), [period, setPeriod] = useState('weekly'), [data, setData] = useState<{ className: string; items: { rank: number; nickname: string; avatar: string; xp: number; score: number | null; me: boolean }[] } | null>(null), [error, setError] = useState('');
  useEffect(() => { if (classId && Number(classId) > 0) void exerciseApi<typeof data>(`/api/exercises/leaderboard?classId=${encodeURIComponent(classId)}&period=${period}`).then(d => { setData(d); setError(''); }).catch(e => setError(e.message)); }, [classId, period]);
  return <main className="mx-auto grid max-w-3xl gap-5 px-4 py-8"><h1 className="text-3xl font-black">Cùng nhau tiến bộ</h1><p>Mỗi lần luyện tập đều đáng tự hào. Bảng chỉ hiển thị các bài giáo viên bật thi đua.</p><ExerciseInput label="Mã lớp" type="number" min={1} value={classId} onChange={e => setClassId(e.target.value)} /><select className={fieldClass} aria-label="Thời gian thi đua" value={period} onChange={e => setPeriod(e.target.value)}><option value="weekly">7 ngày</option><option value="monthly">30 ngày</option></select>{error && <p role="alert">{error}</p>}{data && <><h2 className="text-xl font-bold">{data.className}</h2>{data.items.map(r => <article key={r.rank} className="flex flex-wrap justify-between gap-4 rounded-2xl border bg-white p-5"><p>{r.rank}. {r.avatar} {r.nickname} {r.me && '(Em)'}</p><p>{r.xp} XP · {r.score === null ? '—' : `${r.score}%`}</p></article>)}</>}</main>;
}

