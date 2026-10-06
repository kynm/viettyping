'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Answers, PublicQuestion } from '@/lib/exercises/contracts';
import QuestionRenderer from './QuestionRenderer';
import { ExerciseButton } from './controls';
import { exerciseApi } from './api';
import styles from './exercise.module.css';
export interface AttemptDto {
  id: number; typing: { id: string; duration: number; errors: number; accuracy: number; wpm: number }[]; title: string; needsReview: boolean; questions: PublicQuestion[]; answers: Answers; currentIndex: number; revision: number; startedAt: string; deadline: string | null; submittedAt: string | null;
  result: { score: number; totalScore: number; correct: number; incorrect: number; accuracy: number; seconds: number } | null;
  review: { id: string; correct: boolean; studentAnswer: unknown; correctAnswer: unknown; explanation: string }[] | null;
}
export default function ExercisePlayer({ exerciseId, initialAttemptId }: { exerciseId?: number; initialAttemptId?: number }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDto | null>(null), [error, setError] = useState(''), [status, setStatus] = useState('Đang tải…'), [seconds, setSeconds] = useState(0);
  const attemptRef = useRef<AttemptDto | null>(null);
  const draft = useRef<{ answers: Answers; currentIndex: number; revision: number } | null>(null), dirty = useRef(false), saving = useRef(false), loaded = useRef(false);
  const key = useRef('');
  useEffect(() => {
    let cancelled = false;
    loaded.current = false;
    (async () => {
      try {
        const a = initialAttemptId ? await exerciseApi<AttemptDto>(`/api/attempts/${initialAttemptId}`) : await exerciseApi<AttemptDto>(`/api/exercises/${exerciseId}/attempts`, 'POST', {});
        if (cancelled) return;
        key.current = `exercise-attempt-${a.id}`;
        let local;
        try { local = JSON.parse(localStorage.getItem(key.current) ?? 'null'); } catch { local = null; }
        const recover = !a.submittedAt && local && local.revision === a.revision && Number.isInteger(local.currentIndex) && local.currentIndex >= 0 && local.currentIndex < a.questions.length && local.answers && typeof local.answers === 'object' && !Array.isArray(local.answers);
        draft.current = { answers: recover ? local.answers : a.answers, currentIndex: recover ? local.currentIndex : a.currentIndex, revision: a.revision };
        dirty.current = !!recover;
        attemptRef.current = { ...a, ...draft.current }; setAttempt(attemptRef.current); setStatus(recover ? 'Đã khôi phục bài làm trên thiết bị' : 'Đã đồng bộ'); loaded.current = true;
        if (!initialAttemptId) router.replace(`/exercises/attempts/${a.id}`);
      } catch (e) { setError((e as Error).message); }
    })();
    return () => { cancelled = true; loaded.current = false; };
  }, [exerciseId, initialAttemptId, router]);
  const sync = useCallback(async (submit = false) => {
    const active = attemptRef.current;
    if (!loaded.current || !draft.current || saving.current || !active || active.submittedAt || (!submit && !dirty.current)) return;
    saving.current = true;
    const sent = structuredClone(draft.current);
    try {
      setStatus('Đang lưu…');
      const result = await exerciseApi<AttemptDto>(`/api/attempts/${active.id}`, 'PUT', { ...sent, submit });
      if (!loaded.current) return;
      const changed = JSON.stringify(draft.current) !== JSON.stringify(sent);
      draft.current = { answers: changed && !result.submittedAt ? draft.current.answers : result.answers, currentIndex: changed && !result.submittedAt ? draft.current.currentIndex : result.currentIndex, revision: result.revision };
      dirty.current = changed && !result.submittedAt;
      attemptRef.current = { ...result, ...draft.current }; setAttempt(attemptRef.current);
      let localSaved = true;
      try { if (result.submittedAt) localStorage.removeItem(key.current); else localStorage.setItem(key.current, JSON.stringify(draft.current)); } catch { localSaved = false; }
      setStatus(!localSaved ? 'Đã đồng bộ trên server. Không thể lưu bản dự phòng trên thiết bị.' : dirty.current ? 'Có thay đổi đang chờ lưu' : 'Đã đồng bộ'); setError('');
    } catch (e) {
      if ((e as { status?: number }).status === 409) { loaded.current = false; setError('Bài làm đã thay đổi ở tab khác. Tải lại trang để tiếp tục.'); }
      else if ((e as { status?: number }).status && (e as { status: number }).status < 500) setError((e as Error).message);
      else setStatus('Chưa đồng bộ. Bài làm vẫn được giữ trên thiết bị; sẽ thử lại khi có mạng.');
    } finally { saving.current = false; }
  }, []);
  useEffect(() => { const interval = setInterval(() => { void sync(); }, 1500); const online = () => { void sync(); }; window.addEventListener('online', online); return () => { clearInterval(interval); window.removeEventListener('online', online); }; }, [sync]);
  useEffect(() => {
    if (!attempt || attempt.submittedAt) return;
    const tick = () => { const remaining = attempt.deadline ? Math.max(0, Math.ceil((new Date(attempt.deadline).getTime() - Date.now()) / 1000)) : Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000); setSeconds(remaining); if (attempt.deadline && remaining === 0) void sync(true); };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [attempt, sync]);
  function change(answers: Answers, currentIndex: number) {
    const active = attemptRef.current;
    if (!active || !draft.current || !loaded.current || active.submittedAt) return;
    draft.current = { ...draft.current, answers, currentIndex }; dirty.current = true;
    try { localStorage.setItem(key.current, JSON.stringify(draft.current)); setStatus('Đã lưu trên thiết bị'); } catch { setStatus('Không thể lưu trên thiết bị. Đang chờ đồng bộ server.'); }
    attemptRef.current = { ...active, answers, currentIndex }; setAttempt(attemptRef.current);
  }
  if (!attempt) return <p role="status">{error || status}</p>;
  if (attempt.submittedAt) return <section className={`${styles.complete} min-w-0 grid gap-6 rounded-3xl border-2 border-slate-800 bg-white p-6 text-center`}><h1 className="text-3xl font-black">🎉 Đã hoàn thành!</h1>{attempt.result ? <><p className="text-4xl font-black">{attempt.result.score} / {attempt.result.totalScore}</p><p>{attempt.result.accuracy >= 90 ? 'Excellent!' : attempt.result.accuracy >= 70 ? 'Good!' : 'Keep Practicing!'}</p><p>Đúng: {attempt.result.correct} · Sai: {attempt.result.incorrect} · Chính xác: {attempt.result.accuracy}% · {attempt.result.seconds}s</p></> : <p>{attempt.needsReview ? 'Đã lưu bài làm. Đang chờ giáo viên chấm.' : 'Đã lưu bài làm. Giáo viên đang ẩn kết quả.'}</p>}{attempt.typing?.map(t => <p key={t.id}>⌨️ {t.wpm} WPM · {t.accuracy}% · {t.errors} lỗi · {t.duration}s</p>)}{attempt.review?.map((r, i) => <article key={r.id} className="rounded-xl border p-4 text-left"><h2 className="font-bold">{i + 1}. {attempt.questions[i].prompt} — {r.correct ? '✓ Đúng' : '✗ Chưa đúng'}</h2><p>Bạn trả lời: {JSON.stringify(r.studentAnswer)}</p><p>Đáp án: {JSON.stringify(r.correctAnswer)}</p><p>{r.explanation}</p></article>)}<Link href="/exercises" className="font-bold text-sky-700">Về bài tập của em</Link></section>;
  const q = attempt.questions[attempt.currentIndex];
  return <section className="min-w-0 grid gap-6 rounded-3xl border-2 border-slate-800 bg-white p-4 shadow-md sm:p-8"><h1 className="text-2xl font-black">{attempt.title}</h1><Link href="/exercises" className="text-sky-700">← Bài tập của em</Link><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">Câu {attempt.currentIndex + 1} / {attempt.questions.length}</h2><span>{attempt.deadline ? 'Còn lại' : 'Thời gian'}: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></div><progress aria-label="Tiến độ trả lời" max={attempt.questions.length} value={Object.keys(attempt.answers).length} className="h-3 w-full" /><QuestionRenderer attemptId={attempt.id} key={q.id} question={q} value={attempt.answers[q.id]} onChange={v => { if (draft.current) change({ ...draft.current.answers, [q.id]: v }, draft.current.currentIndex); }} /><div className="flex flex-wrap gap-3"><ExerciseButton disabled={attempt.currentIndex === 0} onClick={() => change(attempt.answers, attempt.currentIndex - 1)}>Trước</ExerciseButton><ExerciseButton disabled={attempt.currentIndex === attempt.questions.length - 1} onClick={() => change(attempt.answers, attempt.currentIndex + 1)}>Tiếp</ExerciseButton><ExerciseButton onClick={() => { if (confirm('Nộp bài và kết thúc lượt làm?')) void sync(true); }}>Nộp bài</ExerciseButton></div><p role="status" className="text-sm">{status}</p>{error && <p role="alert" className="text-red-700">{error}</p>}</section>;
}
